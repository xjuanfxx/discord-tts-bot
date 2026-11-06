/* eslint-disable max-statements */
const logger = require('@greencoast/logger');
const { buildTTSText, getMaxMessageLength } = require('../../utils/tts-text');
const { Collection } = require('discord.js');
const { ensureVoiceConnection } = require('../../utils/channel');

class TTSChannelHandler {
  constructor(client) {
    this.client = client;
    this.warningCooldowns = new Collection();
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

    const settings = await this.client.ttsSettings.getCurrentForChannel(message.channel);
    const extras = settings[channelSettings.provider];

    if (!this.client.providerManager.getProvider(channelSettings.provider).isAvailable()) {
      return this.replyWarning(message, localizer.t('command.say.provider_unavailable', { name: channelSettings.provider }));
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

    const { error, joined, channel } = await ensureVoiceConnection(ttsPlayer, message.member);
    if (error) {
      return this.replyWarning(message, localizer.t(error));
    }

    if (joined) {
      await message.reply(localizer.t('command.say.joined', { channel: channel.toString() }));
    }

    return ttsPlayer.say(textToSay, channelSettings.provider, extras);
  }

  /**
   * Replies with a warning, at most once every WARNING_COOLDOWN per user. In TTS channels every message
   * triggers the bot, so without this someone chatting outside of a voice channel would get a reply to
   * every single message (spam and needless API calls / rate limits).
   */
  replyWarning(message, content) {
    const now = Date.now();
    const last = this.warningCooldowns.get(message.author.id);

    if (last && now - last < TTSChannelHandler.WARNING_COOLDOWN) {
      return;
    }

    this.warningCooldowns.set(message.author.id, now);
    this.warningCooldowns.sweep((time) => now - time >= TTSChannelHandler.WARNING_COOLDOWN);
    return message.reply(content);
  }
}

TTSChannelHandler.WARNING_COOLDOWN = 30 * 1000;

module.exports = TTSChannelHandler;
