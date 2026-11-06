const { SlashCommand } = require('@greencoast/discord.js-extended');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const logger = require('@greencoast/logger');
const ProviderManager = require('../../../classes/tts/providers/ProviderManager');
const { getConfigMaxMessageLength, setGuildMaxMessageLength } = require('../../../utils/tts-text');
const { MAX_MESSAGE_LENGTH_LIMIT } = require('../../../common/constants');

class SetMaxLengthCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'set_max_length',
      description: 'Sets the maximum number of characters per TTS message in this server.',
      emoji: ':straight_ruler:',
      group: 'config',
      guildOnly: true,
      userPermissions: [PermissionsBitField.Flags.ManageGuild],
      dataBuilder: new SlashCommandBuilder()
        .addIntegerOption((input) => {
          return input
            .setName('length')
            .setDescription('Maximum characters per message. Use 0 to remove the limit of this server.')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(MAX_MESSAGE_LENGTH_LIMIT);
        })
    });
  }

  /**
   * Lists the providers whose limit in the bot config is lower than the requested one.
   */
  getCappedProviders(length) {
    return ProviderManager.SUPPORTED_PROVIDERS
      .map((Provider) => ({ name: Provider.NAME, limit: getConfigMaxMessageLength(this.client.config, Provider.NAME) }))
      .filter(({ limit }) => limit > 0 && (length === 0 || limit < length));
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const length = interaction.options.getInteger('length');

    await setGuildMaxMessageLength(this.client, interaction.guild, length);
    logger.info(`${interaction.guild.name} has changed its max message length to ${length}.`);

    const lines = [
      length > 0 ?
        localizer.t('command.max_length.success', { length }) :
        localizer.t('command.max_length.removed')
    ];

    const capped = this.getCappedProviders(length);
    if (capped.length > 0) {
      const list = capped.map(({ name, limit }) => `**${name}**: ${limit}`).join(', ');
      lines.push(localizer.t('command.max_length.capped', { list }));
    }

    return interaction.reply({ content: lines.join('\n') });
  }
}

module.exports = SetMaxLengthCommand;
