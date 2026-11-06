const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');

class SkipCommand extends SlashCommand {
  constructor(client) {
    super(client, {
      name: 'skip',
      description: 'Skip the message that is currently being said.',
      emoji: ':track_next:',
      group: 'all-tts',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
    });
  }

  run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const ttsPlayer = this.client.getTTSPlayer(interaction.guild);
    const myChannel = interaction.guild.members.me.voice?.channel;
    const { channel: memberChannel } = interaction.member.voice;

    if (!ttsPlayer.voice.getConnection()) {
      return interaction.reply({ content: localizer.t('command.stop.no_connection'), flags: MessageFlags.Ephemeral });
    }

    if (!memberChannel || myChannel !== memberChannel) {
      return interaction.reply({ content: localizer.t('command.skip.different_channel'), flags: MessageFlags.Ephemeral });
    }

    if (!ttsPlayer.skip()) {
      return interaction.reply({ content: localizer.t('command.skip.nothing'), flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({ content: localizer.t('command.skip.success') });
  }
}

module.exports = SkipCommand;
