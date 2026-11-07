/* eslint-disable camelcase, no-underscore-dangle */
const axios = require('axios');
const AbstractProvider = require('./AbstractProvider');
const ElevenLabsProvider = require('./ElevenLabsProvider');
const Payload = require('../Payload');

const API_URL = 'https://api.fish.audio';
const REQUEST_TIMEOUT = 20000;
const VOICE_ID_PATTERN = /^[a-f0-9]{32}$/i;

/**
 * A concrete TTS provider for Fish Audio (https://fish.audio). It requires an API key.
 * The API key, model and latency mode are read from the bot config, users and guilds can only pick the voice
 * (any voice model of Fish Audio, by ID or by name).
 */
class FishProvider extends AbstractProvider {
  constructor(client) {
    super(client);
    this.config = client.config;

    // The defaults depend on the config, update them in place so ProviderManager.DEFAULT_SETTINGS
    // (which references this same object) picks them up as well.
    if (this.config) {
      Object.assign(FishProvider.EXTRA_DEFAULTS, {
        voice: this.config.get('FISH_VOICE_ID'),
        language: this.config.get('FISH_LANGUAGE') || FishProvider.EXTRA_DEFAULTS.language
      });
    }
  }

  isAvailable() {
    return !!this.config?.get('FISH_API_KEY');
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.config.get('FISH_API_KEY')}` };
  }

  async createPayload(sentence, extras) {
    if (!this.isAvailable()) {
      throw new Error('Fish Audio is not configured, set FISH_API_KEY in the config.');
    }

    const text = ElevenLabsProvider.truncate(sentence, this.config.get('FISH_MAX_MESSAGE_LENGTH'));
    const voice = extras.voice || this.config.get('FISH_VOICE_ID');

    try {
      const response = await axios.post(`${API_URL}/v1/tts`, {
        text,
        format: 'mp3',
        // "balanced" streams the audio while it's generated: ~0.6s until the first audio instead of ~3s.
        latency: this.config.get('FISH_LATENCY'),
        ...voice ? { reference_id: voice } : {}
      }, {
        headers: { ...this.getHeaders(), model: this.config.get('FISH_MODEL') },
        responseType: 'stream',
        timeout: REQUEST_TIMEOUT
      });

      return new Payload(response.data, text, FishProvider.NAME, extras);
    } catch (error) {
      throw new Error(`Fish Audio request failed: ${await FishProvider.describeError(error)}`);
    }
  }

  /**
   * Searches voices by name. The most used ones come first.
   * @param {string} query
   * @param {string} [language] e.g. "es"
   * @param {number} [limit]
   * @returns {Promise<{ id: string, name: string, languages: string[], uses: number }[]>}
   */
  async searchVoices(query = '', language = '', limit = 10) {
    const response = await axios.get(`${API_URL}/model`, {
      headers: this.getHeaders(),
      timeout: REQUEST_TIMEOUT,
      params: {
        page_size: limit,
        page_number: 1,
        sort_by: 'task_count',
        ...query ? { title: query } : {},
        ...language ? { language } : {}
      }
    });

    return (response.data.items || []).map(FishProvider.toVoice);
  }

  /**
   * Finds a voice by its ID or its name (the most used voice with that name, preferring the given language).
   * @param {string} query
   * @param {string} [language]
   * @returns {Promise<{ id: string, name: string } | null>}
   */
  async findVoice(query, language = '') {
    const trimmed = query.trim();

    if (VOICE_ID_PATTERN.test(trimmed)) {
      try {
        const response = await axios.get(`${API_URL}/model/${trimmed}`, { headers: this.getHeaders(), timeout: REQUEST_TIMEOUT });
        return FishProvider.toVoice(response.data);
      } catch (error) {
        return null;
      }
    }

    const base = (language || '').split('-')[0];
    const inLanguage = base ? await this.searchVoices(trimmed, base, 5) : [];
    const voices = inLanguage.length > 0 ? inLanguage : await this.searchVoices(trimmed, '', 5);

    return voices.find((voice) => voice.name.toLowerCase() === trimmed.toLowerCase()) || voices[0] || null;
  }

  getPlayLogMessage(payload, guild) {
    const { sentence, extras: { voiceName, voice } } = payload;

    return `(Fish): Saying ${sentence} with voice ${voiceName || voice || 'default'} in guild ${guild.name}.`;
  }
}

FishProvider.toVoice = (model) => ({
  id: model._id,
  name: (model.title || model._id).trim(),
  languages: model.languages || [],
  uses: model.task_count || 0
});

/**
 * Turns an axios error from Fish Audio into a readable message (never includes the API key).
 */
FishProvider.describeError = async (error) => {
  const { response } = error;
  if (!response) {
    return error.message;
  }

  let body = response.data;
  try {
    if (body && typeof body.pipe === 'function') {
      const chunks = [];
      for await (const chunk of body) {
        chunks.push(chunk);
      }
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
  } catch (parseError) {
    body = null;
  }

  const message = body?.message || body?.detail;
  return `HTTP ${response.status}${message ? ` - ${typeof message === 'string' ? message : JSON.stringify(message)}` : ''}`;
};

FishProvider.NAME = 'Fish';
FishProvider.FRIENDLY_NAME = 'Fish Audio Provider';

FishProvider.EXTRA_FIELDS = ['voice', 'voiceName', 'language'];
FishProvider.EXTRA_DEFAULTS = {
  voice: null,
  voiceName: 'default',
  language: 'en'
};

module.exports = FishProvider;
