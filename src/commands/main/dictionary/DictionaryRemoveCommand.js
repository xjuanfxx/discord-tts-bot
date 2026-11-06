const { SlashCommand } = require('@greencoast/discord.js-extended');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const logger = require('@greencoast/logger');

class DictionaryRemoveCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'dictionary_remove',
      description: 'Remove a word from the dictionary of this server.',
      emoji: ':wastebasket:',
      group: 'dictionary',
      guildOnly: true,
      userPermissions: [PermissionsBitField.Flags.ManageGuild],
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('word')
            .setDescription('The word or phrase to remove.')
            .setRequired(true);
        })
    });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const word = interaction.options.getString('word');

    const removed = await this.client.guildDictionary.remove(interaction.guild, word);
    if (!removed) {
      return interaction.reply({ content: localizer.t('command.dictionary.remove.not_found', { word }) });
    }

    logger.info(`${interaction.guild.name} removed "${word}" from its dictionary.`);
    return interaction.reply({ content: localizer.t('command.dictionary.remove.success', { word }) });
  }
}

module.exports = DictionaryRemoveCommand;
