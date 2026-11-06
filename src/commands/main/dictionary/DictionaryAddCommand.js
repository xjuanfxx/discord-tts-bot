const { SlashCommand } = require('@greencoast/discord.js-extended');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const logger = require('@greencoast/logger');
const GuildDictionary = require('../../../classes/tts/GuildDictionary');

class DictionaryAddCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'dictionary_add',
      description: 'Make the bot read a word in a different way in this server (e.g. "xd" -> "equis de").',
      emoji: ':book:',
      group: 'dictionary',
      guildOnly: true,
      userPermissions: [PermissionsBitField.Flags.ManageGuild],
      dataBuilder: new SlashCommandBuilder()
        .addStringOption((input) => {
          return input
            .setName('word')
            .setDescription('The word or phrase to replace.')
            .setRequired(true)
            .setMaxLength(GuildDictionary.MAX_WORD_LENGTH);
        })
        .addStringOption((input) => {
          return input
            .setName('replacement')
            .setDescription('How the bot should read it.')
            .setRequired(true)
            .setMaxLength(GuildDictionary.MAX_REPLACEMENT_LENGTH);
        })
    });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const word = GuildDictionary.normalizeWord(interaction.options.getString('word'));
    const replacement = interaction.options.getString('replacement').trim();

    if (!word || !replacement) {
      return interaction.reply({ content: localizer.t('command.dictionary.add.invalid') });
    }

    const entries = await this.client.guildDictionary.get(interaction.guild);
    if (!(word in entries) && Object.keys(entries).length >= GuildDictionary.MAX_ENTRIES) {
      return interaction.reply({ content: localizer.t('command.dictionary.add.full', { max: GuildDictionary.MAX_ENTRIES }) });
    }

    await this.client.guildDictionary.set(interaction.guild, word, replacement);
    logger.info(`${interaction.guild.name} added "${word}" -> "${replacement}" to its dictionary.`);
    return interaction.reply({ content: localizer.t('command.dictionary.add.success', { word, replacement }) });
  }
}

module.exports = DictionaryAddCommand;
