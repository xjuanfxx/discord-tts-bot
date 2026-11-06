const logger = require('@greencoast/logger');
const { ChannelType } = require('discord.js');
const {
  joinVoiceChannel,
  getVoiceConnection,
  entersState,
  AudioPlayer,
  VoiceConnectionStatus
} = require('@discordjs/voice');

// How long to wait for the voice connection to be ready before giving up.
const READY_TIMEOUT = 20000;
// How long to wait for a recoverable disconnect (e.g. being moved to another channel) to reconnect.
const RECONNECT_TIMEOUT = 5000;

class VoiceManager {
  /**
   * @param {Discord.Guild} guild
   * @param {object} [options]
   * @param {AudioPlayer} [options.audioPlayer]
   * @param {Function} [options.onDestroy] Called whenever the voice connection is destroyed for any reason
   * (stop command, inactivity, kicked from the channel, failed to connect...).
   */
  constructor(guild, options = {}) {
    this.guild = guild;
    this.onDestroy = options.onDestroy;

    // The default noSubscriber behavior (Pause) keeps the current message paused while reconnecting
    // (e.g. when a moderator moves the bot) and resumes it once connected again.
    this.player = options.audioPlayer || new AudioPlayer();
  }

  /**
   * Connects to a voice channel. The bot always joins self-deafened (it never needs to listen)
   * and not self-muted (it has to speak).
   * @param {Discord.VoiceBasedChannel} channel
   * @returns {Promise<VoiceManager>} Resolves once the connection is ready, rejects if it could not connect.
   */
  async connect(channel) {
    const current = this.getConnection();
    if (current && current.state.status !== VoiceConnectionStatus.Destroyed) {
      await entersState(current, VoiceConnectionStatus.Ready, READY_TIMEOUT);
      return this;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    connection.subscribe(this.player);

    // Without an error listener an error in the connection would crash the whole process.
    connection.on('error', (error) => {
      logger.error(`Voice connection error in guild ${this.guild.name}: ${error.message}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Moved to another channel or a region change, Discord will reconnect us by itself.
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, RECONNECT_TIMEOUT),
          entersState(connection, VoiceConnectionStatus.Connecting, RECONNECT_TIMEOUT)
        ]);
      } catch (error) {
        // Kicked from the channel or the channel was deleted, this is not recoverable.
        VoiceManager.destroyConnection(connection);
      }
    });

    connection.once(VoiceConnectionStatus.Destroyed, () => {
      if (this.onDestroy) {
        this.onDestroy();
      }
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, READY_TIMEOUT);
    } catch (error) {
      VoiceManager.destroyConnection(connection);
      throw new Error(`Could not connect to the voice channel ${channel.name} in guild ${this.guild.name} within ${READY_TIMEOUT / 1000} seconds.`);
    }

    await this.becomeSpeakerIfStage(channel);
    return this;
  }

  /**
   * In stage channels bots join as audience, try to become a speaker so the TTS can be heard.
   * @param {Discord.VoiceBasedChannel} channel
   */
  async becomeSpeakerIfStage(channel) {
    if (channel.type !== ChannelType.GuildStageVoice) {
      return;
    }

    const myVoice = this.guild.members.me?.voice;
    try {
      await myVoice?.setSuppressed(false);
    } catch (error) {
      // Missing the Mute Members permission, ask to speak instead.
      await myVoice?.setRequestToSpeak(true).catch(() => null);
    }
  }

  disconnect() {
    const connection = this.getConnection();

    if (connection) {
      VoiceManager.destroyConnection(connection);
    }
  }

  getConnection() {
    return getVoiceConnection(this.guild.id);
  }

  play(resource) {
    this.player.play(resource);
  }
}

VoiceManager.destroyConnection = (connection) => {
  if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
    connection.destroy();
  }
};

module.exports = VoiceManager;
