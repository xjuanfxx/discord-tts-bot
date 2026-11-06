/* eslint-disable max-statements */
const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { ensureVoiceConnection } = require('../../utils/channel');
const { buildTTSText, getMaxMessageLength } = require('../../utils/tts-text');

class SayBaseCommand extends SlashCommand {
  constructor(client, options) {
    super(client, {
      name: options.name,
      description: options.description,
      emoji: options.emoji,
      group: options.group,
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('message')
            .setDescription('The message to say in your voice channel.')
            .setRequired(true);
        })
    });
  }

  getProviderName() {
    throw new Error('getProviderName() not implemented!');
  }

  async run(interaction) {
    await interaction.deferReply();

    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const ttsPlayer = this.client.getTTSPlayer(interaction.guild);

    const currentSettings = await this.client.ttsSettings.getCurrent(interaction);
    const providerName = this.getProviderName(currentSettings);
    const extras = currentSettings[providerName];

    if (!this.client.providerManager.getProvider(providerName).isAvailable()) {
      await interaction.editReply(localizer.t('command.say.provider_unavailable', { name: providerName }));
      return;
    }

    const userMessage = interaction.options.getString('message');

    const maxLength = await getMaxMessageLength(this.client, interaction.guild, providerName);
    if (maxLength > 0 && userMessage.length > maxLength) {
      await interaction.editReply(localizer.t('command.say.too_long', { max: maxLength }));
      return;
    }

    const message = await buildTTSText(this.client, { member: interaction.member, content: userMessage, extras });

    if (message.length === 0) {
      await interaction.editReply(localizer.t('command.say.empty'));
      return;
    }

    const { error, joined, channel } = await ensureVoiceConnection(ttsPlayer, interaction.member);
    if (error) {
      await interaction.editReply(localizer.t(error));
      return;
    }

    await interaction.editReply(joined ?
      localizer.t('command.say.joined.withrequest', { channel: channel.toString(), request: userMessage }) :
      localizer.t('command.say.success', { request: userMessage }));
    return ttsPlayer.say(message, providerName, extras);
  }
}

module.exports = SayBaseCommand;
