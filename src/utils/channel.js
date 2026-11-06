const logger = require('@greencoast/logger');

const getCantConnectToChannelReason = (channel) => {
  if (!channel.viewable) {
    return 'error.channel.not_viewable';
  }

  if (channel.full && !channel.joinable) {
    return 'error.channel.full';
  }

  if (!channel.joinable) {
    return 'error.channel.not_joinable';
  }

  if (channel.isVoiceBased() && !channel.speakable) {
    return 'error.channel.not_speakable';
  }
};

const isServerMuted = (guild) => {
  return !!guild.members.me?.voice?.serverMute;
};

/**
 * Makes sure the bot is in the same voice channel as the member, joining it if needed.
 * @param {TTSPlayer} ttsPlayer
 * @param {Discord.GuildMember} member
 * @param {Function} [onCanSpeak] Called as soon as every check passed, before waiting for the connection.
 * Used to start generating the audio while the bot joins the channel.
 * @returns {Promise<{ error?: string, joined?: boolean, channel?: Discord.VoiceBasedChannel }>}
 * error is a locale key to reply with, joined is true if the bot just joined the channel.
 */
const ensureVoiceConnection = async (ttsPlayer, member, onCanSpeak = () => null) => {
  const { guild } = member;
  const memberChannel = member.voice.channel;

  if (!memberChannel) {
    return { error: 'command.say.no_channel' };
  }

  if (ttsPlayer.voice.getConnection()) {
    if (guild.members.me?.voice?.channelId !== memberChannel.id) {
      return { error: 'command.say.different_channel' };
    }

    if (isServerMuted(guild)) {
      return { error: 'error.channel.server_muted' };
    }

    onCanSpeak();
    return { joined: false, channel: memberChannel };
  }

  const cantConnectReason = getCantConnectToChannelReason(memberChannel);
  if (cantConnectReason) {
    return { error: cantConnectReason };
  }

  onCanSpeak();

  try {
    await ttsPlayer.voice.connect(memberChannel);
  } catch (error) {
    logger.error(error.message);
    return { error: 'error.channel.connect_failed' };
  }

  logger.info(`Joined ${memberChannel.name} in ${guild.name}.`);

  if (isServerMuted(guild)) {
    return { error: 'error.channel.server_muted' };
  }

  return { joined: true, channel: memberChannel };
};

module.exports = {
  getCantConnectToChannelReason,
  ensureVoiceConnection
};
