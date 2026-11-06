const { PermissionsBitField } = require('discord.js');
const EdgeSetSettingsBaseCommand = require('../../../base/EdgeSetSettingsBaseCommand');

class EdgeSetChannelSettingsCommand extends EdgeSetSettingsBaseCommand {
  constructor(client) {
    super(client, {
      name: 'edge_set_channel',
      description: 'Sets the settings to be used with message-only based TTS from Edge.',
      group: 'edge-tts',
      userPermissions: [PermissionsBitField.Flags.ManageChannels]
    });
  }

  getEntity(interaction) {
    return interaction.channel;
  }

  getSuccessKey() {
    return 'channel_commands.edge.settings.success';
  }
}

module.exports = EdgeSetChannelSettingsCommand;
