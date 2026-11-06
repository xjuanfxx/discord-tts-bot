const { Collection } = require('discord.js');

const DATA_KEY = 'tts_dictionary';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Per-guild word replacements applied before a message is spoken (e.g. "xd" -> "equis de").
 */
class GuildDictionary {
  constructor(client) {
    this.client = client;
    this.cache = new Collection();
  }

  /**
   * @param {Discord.Guild} guild
   * @returns {Promise<Record<string, string>>}
   */
  async get(guild) {
    const fromCache = this.cache.get(guild.id);
    if (fromCache) {
      return fromCache.entries;
    }

    const entries = await this.client.dataProvider.get(guild, DATA_KEY, {});
    this._cache(guild, entries);
    return entries;
  }

  async set(guild, word, replacement) {
    const entries = { ...await this.get(guild), [GuildDictionary.normalizeWord(word)]: replacement.trim() };
    await this._save(guild, entries);
  }

  /**
   * @returns {Promise<boolean>} Whether the word existed.
   */
  async remove(guild, word) {
    const entries = { ...await this.get(guild) };
    const key = GuildDictionary.normalizeWord(word);

    if (!(key in entries)) {
      return false;
    }

    delete entries[key];
    await this._save(guild, entries);
    return true;
  }

  async apply(guild, text) {
    await this.get(guild);
    const { pattern, entries } = this.cache.get(guild.id);

    if (!pattern) {
      return text;
    }

    return text.replace(pattern, (match) => entries[match.toLowerCase()] ?? match);
  }

  async _save(guild, entries) {
    await this.client.dataProvider.set(guild, DATA_KEY, entries);
    this._cache(guild, entries);
  }

  _cache(guild, entries) {
    // Longest words first so "gg wp" wins over "gg".
    const words = Object.keys(entries).sort((a, b) => b.length - a.length);
    const pattern = words.length > 0 ?
      new RegExp(`(?<![\\p{L}\\p{N}_])(?:${words.map(escapeRegex).join('|')})(?![\\p{L}\\p{N}_])`, 'giu') :
      null;

    this.cache.set(guild.id, { entries, pattern });
  }

  delete(guild) {
    this.cache.delete(guild.id);
  }
}

GuildDictionary.normalizeWord = (word) => word.trim().toLowerCase();
GuildDictionary.MAX_ENTRIES = 100;
GuildDictionary.MAX_WORD_LENGTH = 50;
GuildDictionary.MAX_REPLACEMENT_LENGTH = 100;

module.exports = GuildDictionary;
