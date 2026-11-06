const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('@greencoast/logger');
const { MESSAGE_EMBED } = require('../../../common/constants');
const EdgeProvider = require('../../../classes/tts/providers/EdgeProvider');

const EMBED_DESCRIPTION_MAX_SIZE = 4096;

class EdgeVoicesCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'edge_voices',
      description: 'Display the voices of a language for the Edge provider.',
      emoji: ':page_facing_up:',
      group: 'edge-tts',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('language')
            .setDescription('Language code, e.g. es, es-MX or en-US. Omit this to see the voices of your language.')
            .setRequired(false);
        })
    });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const provider = this.client.providerManager.getProvider(EdgeProvider.NAME);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const current = await this.client.ttsSettings.getCurrent(interaction);
    const language = interaction.options.getString('language') || (current[EdgeProvider.NAME]?.language || 'en').split('-')[0];

    let voices;
    try {
      voices = await provider.getVoicesForLanguage(language);
    } catch (error) {
      logger.error(`Could not fetch the Edge voices: ${error.message}`);
      return interaction.editReply(localizer.t('command.edge.voices.error'));
    }

    if (voices.length < 1) {
      return interaction.editReply(localizer.t('command.edge.voices.empty', { language }));
    }

    // One line per locale: "es-MX: Dalia (Female), Jorge (Male)".
    const byLocale = voices.reduce((groups, voice) => {
      (groups[voice.locale] = groups[voice.locale] || []).push(`${voice.name} (${voice.gender})`);
      return groups;
    }, {});

    let description = Object.keys(byLocale)
      .sort()
      .map((locale) => `**${locale}**: ${byLocale[locale].join(', ')}`)
      .join('\n');

    if (description.length > EMBED_DESCRIPTION_MAX_SIZE) {
      description = `${description.slice(0, EMBED_DESCRIPTION_MAX_SIZE - 1)}…`;
    }

    const embed = new EmbedBuilder()
      .setTitle(localizer.t('command.edge.voices.embed.title', { language }))
      .setColor(MESSAGE_EMBED.color)
      .setDescription(description)
      .setFooter({ text: localizer.t('command.edge.voices.embed.footer') });

    return interaction.editReply({ embeds: [embed] });
  }
}

module.exports = EdgeVoicesCommand;
