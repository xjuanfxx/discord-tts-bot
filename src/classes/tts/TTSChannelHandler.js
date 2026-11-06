/* eslint-disable max-statements */
const logger = require('@greencoast/logger');
const { buildTTSText, getMaxMessageLength } = require('../../utils/tts-text');
const { getCantConnectToChannelReason } = require('../../utils/channel');

class TTSChannelHandler {
  constructor(client) {
    this.client = client;
  }

  initialize() {
    this.client.on('messageCreate', this.handleMessage.bind(this));
  }

  async handleMessage(message) {
    try {
      if (message.author.bot || !message.guild || !message.member || !message.content) {
        return;
      }

      const ignorePrefix = this.client.config.get('TTS_CHANNEL_IGNORE_PREFIX');
      if (ignorePrefix && message.content.startsWith(ignorePrefix)) {
        return;
      }

      const channelSettings = await this.client.ttsSettings.get(message.channel);
      if (!channelSettings || !channelSettings.provider) {
        return;
      }

      return await this.handleSay(message, channelSettings);
    } catch (error) {
      logger.error(`Something happened when handling the TTS channel ${message.channel?.name} with message from ${message.member?.displayName ?? message.author?.tag}`);
      logger.error(error);
    }
  }

  async handleSay(message, channelSettings) {
    const localizer = this.client.localizer.getLocalizer(message.guild);
    const ttsPlayer = this.client.getTTSPlayer(message.guild);
    const connection = ttsPlayer.voice.getConnection();

    const settings = await this.client.ttsSettings.getCurrentForChannel(message.channel);
    const extras = settings[channelSettings.provider];

    const { members: { me: { voice: myVoice } }, name: guildName } = message.guild;
    const { channel: memberChannel } = message.member.voice;
    const myChannel = myVoice?.channel;

    if (!this.client.providerManager.getProvider(channelSettings.provider).isAvailable()) {
      return message.reply(localizer.t('command.say.provider_unavailable', { name: channelSettings.provider }));
    }

    const maxLength = await getMaxMessageLength(this.client, message.guild, channelSettings.provider);
    const rawContent = maxLength > 0 && message.content.length > maxLength ?
      message.content.slice(0, maxLength) :
      message.content;
    const textToSay = await buildTTSText(this.client, {
      member: message.member,
      content: rawContent,
      extras,
      mentionedMembers: message.mentions?.members
    });

    if (textToSay.length === 0) {
      return;
    }

    if (!memberChannel) {
      return message.reply(localizer.t('command.say.no_channel'));
    }

    if (connection) {
      if (myChannel !== memberChannel) {
        return message.reply(localizer.t('command.say.different_channel'));
      }

      return ttsPlayer.say(textToSay, channelSettings.provider, extras);
    }

    const cantConnectReason = getCantConnectToChannelReason(memberChannel);
    if (cantConnectReason) {
      return message.reply(localizer.t(cantConnectReason));
    }

    await ttsPlayer.voice.connect(memberChannel);
    logger.info(`Joined ${memberChannel.name} in ${guildName}.`);
    await message.reply(localizer.t('command.say.joined', { channel: memberChannel.toString() }));
    return ttsPlayer.say(textToSay, channelSettings.provider, extras);
  }
}

module.exports = TTSChannelHandler;
