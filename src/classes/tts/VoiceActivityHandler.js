const logger = require('@greencoast/logger');
const { Collection } = require('discord.js');
const { ALONE_LEAVE_DELAY } = require('../../common/constants');

/**
 * Makes the bot leave its voice channel when every human has left it, instead of waiting for the inactivity timeout.
 */
class VoiceActivityHandler {
  constructor(client) {
    this.client = client;
    this.pendingLeaves = new Collection();
  }

  initialize() {
    this.client.on('voiceStateUpdate', this.handleVoiceStateUpdate.bind(this));
  }

  handleVoiceStateUpdate(oldState, newState) {
    const { guild } = newState;
    const myChannel = guild.members.me?.voice?.channel;

    if (!myChannel) {
      this.cancelLeave(guild);
      return;
    }

    if (oldState.channelId !== myChannel.id && newState.channelId !== myChannel.id) {
      return;
    }

    if (VoiceActivityHandler.isAlone(myChannel)) {
      this.scheduleLeave(guild);
    } else {
      this.cancelLeave(guild);
    }
  }

  scheduleLeave(guild) {
    if (this.pendingLeaves.has(guild.id)) {
      return;
    }

    // Small delay so someone who reconnects or switches channels for a moment doesn't kick the bot out.
    const handle = setTimeout(() => {
      this.pendingLeaves.delete(guild.id);

      const myChannel = guild.members.me?.voice?.channel;
      const ttsPlayer = this.client.getTTSPlayer(guild);
      if (!myChannel || !ttsPlayer || !VoiceActivityHandler.isAlone(myChannel)) {
        return;
      }

      ttsPlayer.stop();
      logger.info(`Left ${myChannel.name} from ${guild.name} because everyone else left.`);
    }, ALONE_LEAVE_DELAY);

    this.pendingLeaves.set(guild.id, handle);
  }

  cancelLeave(guild) {
    const handle = this.pendingLeaves.get(guild.id);

    if (handle) {
      clearTimeout(handle);
      this.pendingLeaves.delete(guild.id);
    }
  }
}

VoiceActivityHandler.isAlone = (channel) => {
  return !channel.members.some((member) => !member.user.bot);
};

module.exports = VoiceActivityHandler;
