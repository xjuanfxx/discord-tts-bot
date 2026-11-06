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
    // Don't wait for Discord to acknowledge the interaction before starting, every reply waits for it instead.
    const deferred = interaction.deferReply();
    // Avoid an unhandled rejection if something throws before the first reply (reply() still rethrows it).
    deferred.catch(() => null);
    const reply = async (content) => {
      await deferred;
      return interaction.editReply(content);
    };

    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const ttsPlayer = this.client.getTTSPlayer(interaction.guild);

    const currentSettings = await this.client.ttsSettings.getCurrent(interaction);
    const providerName = this.getProviderName(currentSettings);
    const extras = currentSettings[providerName];

    if (!this.client.providerManager.getProvider(providerName).isAvailable()) {
      await reply(localizer.t('command.say.provider_unavailable', { name: providerName }));
      return;
    }

    const userMessage = interaction.options.getString('message');

    const maxLength = await getMaxMessageLength(this.client, interaction.guild, providerName);
    if (maxLength > 0 && userMessage.length > maxLength) {
      await reply(localizer.t('command.say.too_long', { max: maxLength }));
      return;
    }

    const message = await buildTTSText(this.client, { member: interaction.member, content: userMessage, extras });

    if (message.length === 0) {
      await reply(localizer.t('command.say.empty'));
      return;
    }

    // The audio starts being generated as soon as the checks pass, while the bot joins the channel.
    let prepared = null;
    const { error, joined, channel } = await ensureVoiceConnection(ttsPlayer, interaction.member, () => {
      prepared = ttsPlayer.prepare(message, providerName, extras);
    });

    if (error) {
      if (prepared) {
        ttsPlayer.discard(prepared);
      }
      await reply(localizer.t(error));
      return;
    }

    // Queue it before replying, the reply doesn't have to delay the audio.
    ttsPlayer.enqueue(prepared);
    await reply(joined ?
      localizer.t('command.say.joined.withrequest', { channel: channel.toString(), request: userMessage }) :
      localizer.t('command.say.success', { request: userMessage }));
  }
}

module.exports = SayBaseCommand;
