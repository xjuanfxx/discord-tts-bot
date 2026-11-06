const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { MESSAGE_EMBED } = require('../../../common/constants');

const EMBED_DESCRIPTION_MAX_SIZE = 4096;

class DictionaryListCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'dictionary_list',
      description: 'Show the words the bot reads in a different way in this server.',
      emoji: ':books:',
      group: 'dictionary',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
    });
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const entries = Object.entries(await this.client.guildDictionary.get(interaction.guild));

    if (entries.length === 0) {
      return interaction.reply({ content: localizer.t('command.dictionary.list.empty') });
    }

    let description = entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([word, replacement]) => `**${word}** → ${replacement}`)
      .join('\n');

    if (description.length > EMBED_DESCRIPTION_MAX_SIZE) {
      description = `${description.slice(0, EMBED_DESCRIPTION_MAX_SIZE - 1)}…`;
    }

    const embed = new EmbedBuilder()
      .setTitle(localizer.t('command.dictionary.list.embed.title', { count: entries.length }))
      .setColor(MESSAGE_EMBED.color)
      .setDescription(description);

    return interaction.reply({ embeds: [embed] });
  }
}

module.exports = DictionaryListCommand;
