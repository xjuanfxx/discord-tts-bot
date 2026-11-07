const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('@greencoast/logger');
const { MESSAGE_EMBED } = require('../../../common/constants');
const FishProvider = require('../../../classes/tts/providers/FishProvider');

const formatUses = (uses) => {
  if (uses >= 1000000) {
    return `${(uses / 1000000).toFixed(1)}M`;
  }

  return uses >= 1000 ? `${Math.round(uses / 1000)}k` : `${uses}`;
};

class FishVoicesCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'fish_voices',
      description: 'Search the voices available for the Fish Audio provider.',
      emoji: ':page_facing_up:',
      group: 'fish-tts',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('search')
            .setDescription('Part of the voice name. Omit this to see the most used voices.')
            .setRequired(false);
        })
        .addStringOption((input) => {
          return input
            .setName('language')
            .setDescription('Language code, e.g. es or en. Defaults to the language of your current Fish voice.')
            .setRequired(false);
        })
    });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const provider = this.client.providerManager.getProvider(FishProvider.NAME);

    if (!provider.isAvailable()) {
      return interaction.reply({ content: localizer.t('command.say.provider_unavailable', { name: FishProvider.NAME }), flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const current = await this.client.ttsSettings.getCurrent(interaction);
    const search = interaction.options.getString('search') || '';
    const language = (interaction.options.getString('language') || current[FishProvider.NAME]?.language || 'en').split('-')[0];

    let voices;
    try {
      voices = await provider.searchVoices(search, language, 15);
    } catch (error) {
      logger.error(`Could not fetch the Fish Audio voices: ${await FishProvider.describeError(error)}`);
      return interaction.editReply(localizer.t('command.fish.voices.error'));
    }

    if (voices.length < 1) {
      return interaction.editReply(localizer.t('command.fish.voices.empty', { language }));
    }

    const description = voices
      .map((voice) => `• **${voice.name}** (${voice.languages.join(', ') || '?'}) · ${formatUses(voice.uses)} · \`${voice.id}\``)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle(localizer.t('command.fish.voices.embed.title', { language }))
      .setColor(MESSAGE_EMBED.color)
      .setDescription(description)
      .setFooter({ text: localizer.t('command.fish.voices.embed.footer') });

    return interaction.editReply({ embeds: [embed] });
  }
}

module.exports = FishVoicesCommand;
