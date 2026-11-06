/* eslint-disable camelcase */
const axios = require('axios');
const AbstractProvider = require('./AbstractProvider');
const Payload = require('../Payload');

const API_URL = 'https://api.elevenlabs.io/v1';
const REQUEST_TIMEOUT = 20000;
const VOICES_CACHE_TTL = 10 * 60 * 1000;
const VOICE_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

/**
 * A concrete TTS provider for ElevenLabs (https://elevenlabs.io). It requires an API key.
 * Everything that costs money or affects every guild (API key, model, voice settings, char limit)
 * is read from the bot config, users and guilds can only pick the voice.
 */
class ElevenLabsProvider extends AbstractProvider {
  constructor(client) {
    super(client);
    this.config = client.config;
    this.voicesCache = null;

    // The defaults depend on the config, update them in place so ProviderManager.DEFAULT_SETTINGS
    // (which references this same object) picks them up as well.
    if (this.config) {
      Object.assign(ElevenLabsProvider.EXTRA_DEFAULTS, {
        voice: this.config.get('ELEVENLABS_VOICE_ID'),
        language: this.config.get('ELEVENLABS_LANGUAGE')
      });
    }
  }

  isAvailable() {
    return !!this.config?.get('ELEVENLABS_API_KEY');
  }

  getHeaders() {
    return { 'xi-api-key': this.config.get('ELEVENLABS_API_KEY') };
  }

  async createPayload(sentence, extras) {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs is not configured, set ELEVENLABS_API_KEY in the config.');
    }

    const maxLength = this.config.get('ELEVENLABS_MAX_MESSAGE_LENGTH');
    const text = ElevenLabsProvider.truncate(sentence, maxLength);
    const voice = extras.voice || this.config.get('ELEVENLABS_VOICE_ID');

    try {
      const response = await axios.post(`${API_URL}/text-to-speech/${encodeURIComponent(voice)}`, {
        text,
        model_id: this.config.get('ELEVENLABS_MODEL_ID'),
        voice_settings: {
          stability: this.config.get('ELEVENLABS_STABILITY'),
          similarity_boost: this.config.get('ELEVENLABS_SIMILARITY_BOOST'),
          style: this.config.get('ELEVENLABS_STYLE'),
          use_speaker_boost: this.config.get('ELEVENLABS_SPEAKER_BOOST')
        }
      }, {
        headers: { ...this.getHeaders(), accept: 'audio/mpeg' },
        params: { output_format: this.config.get('ELEVENLABS_OUTPUT_FORMAT') },
        responseType: 'stream',
        timeout: REQUEST_TIMEOUT
      });

      return new Payload(response.data, text, ElevenLabsProvider.NAME, extras);
    } catch (error) {
      throw new Error(`ElevenLabs request failed: ${await ElevenLabsProvider.describeError(error)}`);
    }
  }

  /**
   * Gets the voices available for the configured API key. Cached for a few minutes.
   * @returns {Promise<{ id: string, name: string, description: string }[]>}
   */
  async getVoices() {
    if (this.voicesCache && Date.now() - this.voicesCache.time < VOICES_CACHE_TTL) {
      return this.voicesCache.voices;
    }

    const response = await axios.get(`${API_URL}/voices`, { headers: this.getHeaders(), timeout: REQUEST_TIMEOUT });
    const voices = response.data.voices.map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
      description: [voice.labels?.gender, voice.labels?.accent, voice.labels?.language].filter(Boolean).join(', ')
    }));

    this.voicesCache = { voices, time: Date.now() };
    return voices;
  }

  /**
   * Finds a voice by its name or ID. If the voices can't be fetched, any valid looking ID is accepted.
   * @param {string} query
   * @returns {Promise<{ id: string, name: string } | null>}
   */
  async findVoice(query) {
    const trimmed = query.trim();

    try {
      const voices = await this.getVoices();
      return voices.find((voice) => voice.id === trimmed) ||
        voices.find((voice) => voice.name.toLowerCase() === trimmed.toLowerCase()) ||
        voices.find((voice) => voice.name.toLowerCase().startsWith(trimmed.toLowerCase())) ||
        null;
    } catch (error) {
      return VOICE_ID_PATTERN.test(trimmed) ? { id: trimmed, name: trimmed } : null;
    }
  }

  getPlayLogMessage(payload, guild) {
    const { sentence, extras: { voiceName, voice } } = payload;

    return `(ElevenLabs): Saying ${sentence} with voice ${voiceName || voice} in guild ${guild.name}.`;
  }
}

/**
 * Cuts a sentence to at most maxLength characters without splitting the last word (0 means no limit).
 */
ElevenLabsProvider.truncate = (sentence, maxLength) => {
  if (!maxLength || maxLength <= 0 || sentence.length <= maxLength) {
    return sentence;
  }

  const cut = sentence.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
};

/**
 * Turns an axios error from ElevenLabs into a readable message (never includes the API key).
 */
ElevenLabsProvider.describeError = async (error) => {
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

  const detail = body?.detail;
  const message = typeof detail === 'string' ? detail : detail?.message || detail?.status;
  return `HTTP ${response.status}${message ? ` - ${message}` : ''}`;
};

ElevenLabsProvider.NAME = 'ElevenLabs';
ElevenLabsProvider.FRIENDLY_NAME = 'ElevenLabs AI Provider';

ElevenLabsProvider.EXTRA_FIELDS = ['voice', 'voiceName', 'language'];
ElevenLabsProvider.EXTRA_DEFAULTS = {
  voice: null,
  voiceName: 'default',
  language: 'en'
};

module.exports = ElevenLabsProvider;
