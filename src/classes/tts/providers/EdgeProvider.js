const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const AbstractProvider = require('./AbstractProvider');
const Payload = require('../Payload');
const { oldChoiceListToNew } = require('../../../utils/upgrade-utils');

const VOICES_CACHE_TTL = 6 * 60 * 60 * 1000;
// Connections kept open (one per voice) so the next messages don't have to connect again.
const MAX_OPEN_CLIENTS = 10;
const VOICE_PATTERN = /^[a-z]{2,3}-[A-Z]{2,4}(-[A-Za-z]+)?-[A-Za-z]+Neural$/;

const escapeXml = (text) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

/**
 * Gets the language of a voice from its name (es-MX-DaliaNeural -> es-mx), used for the emoji names.
 */
const getVoiceLanguage = (voice) => {
  const match = /^([a-z]{2,3}-[A-Z]{2,4})/.exec(voice || '');
  return match ? match[1].toLowerCase() : 'en';
};

/**
 * A concrete TTS provider for the Microsoft Edge "Read Aloud" neural voices. Free and without an API key.
 */
class EdgeProvider extends AbstractProvider {
  constructor(client) {
    super(client);
    this.config = client.config;
    this.clients = new Map();
    this.voicesCache = null;

    // The defaults depend on the config, update them in place so ProviderManager.DEFAULT_SETTINGS
    // (which references this same object) picks them up as well.
    const voice = this.config?.get('EDGE_VOICE');
    if (voice) {
      Object.assign(EdgeProvider.EXTRA_DEFAULTS, { voice, language: getVoiceLanguage(voice) });
    }
  }

  /**
   * Gets a connected client for a voice, reusing the open connection if there is one.
   * @param {string} voice
   * @returns {Promise<MsEdgeTTS>}
   */
  getClient(voice) {
    const existing = this.clients.get(voice);
    if (existing) {
      // Move it to the end, the first entry is the least recently used one.
      this.clients.delete(voice);
      this.clients.set(voice, existing);
      return existing;
    }

    const tts = new MsEdgeTTS();
    const ready = tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3).then(() => tts);
    ready.tts = tts;
    ready.catch(() => this.clients.delete(voice));
    this.clients.set(voice, ready);

    if (this.clients.size > MAX_OPEN_CLIENTS) {
      const [oldestVoice, oldest] = this.clients.entries().next().value;
      this.clients.delete(oldestVoice);
      oldest.tts.close();
    }

    return ready;
  }

  async createPayload(sentence, extras) {
    const voice = extras.voice || EdgeProvider.EXTRA_DEFAULTS.voice;
    let tts;

    try {
      tts = await this.getClient(voice);
    } catch (error) {
      throw new Error(`Could not connect to Edge TTS: ${error.message}`);
    }

    const { audioStream } = tts.toStream(escapeXml(sentence), {
      rate: extras.rate || 'default',
      pitch: extras.pitch || 'default'
    });

    return new Payload(audioStream, sentence, EdgeProvider.NAME, extras);
  }

  /**
   * Gets every available voice. Cached for a few hours.
   * @returns {Promise<{ id: string, name: string, locale: string, gender: string }[]>}
   */
  async getVoices() {
    if (this.voicesCache && Date.now() - this.voicesCache.time < VOICES_CACHE_TTL) {
      return this.voicesCache.voices;
    }

    const voices = (await new MsEdgeTTS().getVoices()).map((voice) => ({
      id: voice.ShortName,
      // "Microsoft Dalia Online (Natural) - Spanish (Mexico)" -> "Dalia"
      name: voice.ShortName.split('-').pop().replace(/Neural$/, ''),
      locale: voice.Locale,
      gender: voice.Gender
    }));

    this.voicesCache = { voices, time: Date.now() };
    return voices;
  }

  /**
   * Gets the voices of a language ("es" or "es-MX").
   */
  async getVoicesForLanguage(language) {
    const query = language.toLowerCase();
    const voices = await this.getVoices();
    return voices.filter((voice) => {
      const locale = voice.locale.toLowerCase();
      return locale === query || locale.startsWith(`${query}-`);
    });
  }

  /**
   * Finds a voice by its full ID (es-MX-DaliaNeural) or its short name (Dalia). With a short name, voices
   * in the preferred language are picked first. If the voices can't be fetched, any valid looking ID is accepted.
   * @param {string} query
   * @param {string} [preferredLanguage] e.g. "es-mx"
   * @returns {Promise<{ id: string, name: string, locale: string } | null>}
   */
  async findVoice(query, preferredLanguage = '') {
    const trimmed = query.trim();
    const lower = trimmed.toLowerCase();

    try {
      const voices = await this.getVoices();
      const exact = voices.find((voice) => voice.id.toLowerCase() === lower);
      if (exact) {
        return exact;
      }

      const byName = voices.filter((voice) => voice.name.toLowerCase() === lower);
      const preferredBase = preferredLanguage.split('-')[0];
      return byName.find((voice) => voice.locale.toLowerCase() === preferredLanguage) ||
        byName.find((voice) => voice.locale.toLowerCase().startsWith(`${preferredBase}-`)) ||
        byName[0] ||
        null;
    } catch (error) {
      return VOICE_PATTERN.test(trimmed) ? { id: trimmed, name: trimmed, locale: trimmed.split('-').slice(0, 2).join('-') } : null;
    }
  }

  getPlayLogMessage(payload, guild) {
    const { sentence, extras: { voice, rate, pitch } } = payload;

    return `(Edge): Saying ${sentence} with voice ${voice}, ${rate} rate and ${pitch} pitch in guild ${guild.name}.`;
  }
}

EdgeProvider.NAME = 'Edge';
EdgeProvider.FRIENDLY_NAME = 'Microsoft Edge (Neural) Provider';
EdgeProvider.getVoiceLanguage = getVoiceLanguage;

EdgeProvider.EXTRA_FIELDS = ['voice', 'language', 'rate', 'pitch'];
EdgeProvider.EXTRA_DEFAULTS = {
  voice: 'en-US-AriaNeural',
  language: 'en-us',
  rate: 'default',
  pitch: 'default'
};

EdgeProvider.getSupportedRateChoices = () => {
  return oldChoiceListToNew([
    ['Default Rate', 'default'],
    ['Extra Slow', 'x-slow'],
    ['Slow', 'slow'],
    ['Medium', 'medium'],
    ['Fast', 'fast'],
    ['Extra Fast', 'x-fast']
  ]);
};

EdgeProvider.getSupportedPitchChoices = () => {
  return oldChoiceListToNew([
    ['Default Pitch', 'default'],
    ['Extra Low', 'x-low'],
    ['Low', 'low'],
    ['Medium', 'medium'],
    ['High', 'high'],
    ['Extra High', 'x-high']
  ]);
};

module.exports = EdgeProvider;
