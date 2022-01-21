const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { MESSAGE_EMBED } = require('../../../src/common/constants');

class HelpCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'help',
      description: 'Display a help message with all the available commands.',
      emoji: ':question:',
      group: 'misc',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
    });
  }

  prepareFields() {
    return this.client.registry.groups.map((group) => {
      const listOfCommands = group.commands.reduce((text, command) => {
        return text.concat(`${command.emoji} **/${command.name}** - ${command.description}\n`);
      }, '');

      return { title: group.name, text: listOfCommands };
    });
  }

  run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const fields = this.prepareFields();
    const embed = new MessageEmbed()
      .setTitle(localizer.t('command.help.embed.title'))
      .setColor(MESSAGE_EMBED.color)
      .setThumbnail(MESSAGE_EMBED.helpThumbnail);

    for (const key in fields) {
      const field = fields[key];
      embed.addField(field.title, field.text);
    }

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setStyle('LINK')
          .setEmoji('🐛')
          .setLabel(localizer.t('command.help.links.bug'))
          .setURL(MESSAGE_EMBED.helpURL),
        new MessageButton()
          .setStyle('LINK')
          .setEmoji('☕')
          .setLabel(localizer.t('command.help.links.kofi'))
          .setURL(MESSAGE_EMBED.kofiURL)
      );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
}

module.exports = HelpCommand;
