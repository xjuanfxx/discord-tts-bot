const { Collection } = require('discord.js');
const { ExtendedClient } = require('@greencoast/discord.js-extended');
const ProviderManager = require('../tts/providers/ProviderManager');
const TTSPlayer = require('../tts/TTSPlayer');
const CachedTTSSettings = require('../tts/CachedTTSSettings');
const GuildDictionary = require('../tts/GuildDictionary');
const TTSChannelHandler = require('../tts/TTSChannelHandler');
const VoiceActivityHandler = require('../tts/VoiceActivityHandler');
const Scheduler = require('../Scheduler');

class TTSClient extends ExtendedClient {
  constructor(options) {
    super(options);

    this.ttsPlayers = new Collection();
    this.disconnectSchedulers = new Collection();

    this.providerManager = new ProviderManager(this);
    this.ttsSettings = new CachedTTSSettings(this);
    this.guildDictionary = new GuildDictionary(this);
    this.ttsChannelHandler = new TTSChannelHandler(this);
    this.voiceActivityHandler = new VoiceActivityHandler(this);
  }

  async initializeDependencies() {
    return Promise.all(this.guilds.cache.map((guild) => this.initializeDependenciesForGuild(guild)));
  }

  async initializeDependenciesForGuild(guild) {
    const timeout = await this.dataProvider.get(guild, 'disconnectTimeout', this.config.get('DEFAULT_DISCONNECT_TIMEOUT') * 60 * 1000);
    const scheduler = new Scheduler(this, guild, timeout);

    this.disconnectSchedulers.set(guild.id, scheduler);
    this.ttsPlayers.set(guild.id, new TTSPlayer(this, guild, scheduler));
  }

  deleteDependenciesForGuild(guild) {
    // Leave the voice channel and clear the timers, otherwise they would fire for a guild we're no longer in.
    this.getTTSPlayer(guild)?.stop();
    this.voiceActivityHandler.cancelLeave(guild);
    this.ttsPlayers.delete(guild.id);
    this.disconnectSchedulers.delete(guild.id);
    this.guildDictionary.delete(guild);
  }

  getTTSPlayer(guild) {
    return this.ttsPlayers.get(guild.id);
  }
}

module.exports = TTSClient;
