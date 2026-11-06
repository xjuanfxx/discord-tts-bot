const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('@greencoast/logger');
const { MESSAGE_EMBED } = require('../../../common/constants');
const ElevenLabsProvider = require('../../../classes/tts/providers/ElevenLabsProvider');

const EMBED_DESCRIPTION_MAX_SIZE = 4096;

class ElevenLabsVoicesCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_voices',
      description: 'Display a list of the voices available for the ElevenLabs provider.',
      emoji: ':page_facing_up:',
      group: 'elevenlabs-tts',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
    });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const provider = this.client.providerManager.getProvider(ElevenLabsProvider.NAME);

    if (!provider.isAvailable()) {
      return interaction.reply({ content: localizer.t('command.say.provider_unavailable', { name: ElevenLabsProvider.NAME }), flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let voices;
    try {
      voices = await provider.getVoices();
    } catch (error) {
      logger.error(`Could not fetch ElevenLabs voices: ${await ElevenLabsProvider.describeError(error)}`);
      return interaction.editReply(localizer.t('command.elevenlabs.voices.error'));
    }

    let description = voices
      .map((voice) => `• **${voice.name}**${voice.description ? ` (${voice.description})` : ''} - \`${voice.id}\``)
      .join('\n');

    if (description.length > EMBED_DESCRIPTION_MAX_SIZE) {
      description = `${description.slice(0, EMBED_DESCRIPTION_MAX_SIZE - 1)}…`;
    }

    const embed = new EmbedBuilder()
      .setTitle(localizer.t('command.elevenlabs.voices.embed.title'))
      .setColor(MESSAGE_EMBED.color)
      .setDescription(description || localizer.t('command.elevenlabs.voices.empty'))
      .setFooter({ text: localizer.t('command.elevenlabs.voices.embed.footer') });

    return interaction.editReply({ embeds: [embed] });
  }
}

module.exports = ElevenLabsVoicesCommand;
