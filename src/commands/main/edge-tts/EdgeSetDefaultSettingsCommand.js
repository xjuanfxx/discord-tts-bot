const { PermissionsBitField } = require('discord.js');
const EdgeSetSettingsBaseCommand = require('../../base/EdgeSetSettingsBaseCommand');

class EdgeSetDefaultSettingsCommand extends EdgeSetSettingsBaseCommand {
  constructor(client) {
    super(client, {
      name: 'edge_set_default',
      description: 'Sets the settings to be used by the say and edge_say commands by default.',
      group: 'edge-tts',
      userPermissions: [PermissionsBitField.Flags.ManageGuild]
    });
  }

  getEntity(interaction) {
    return interaction.guild;
  }

  getSuccessKey() {
    return 'command.edge.settings.default.success';
  }
}

module.exports = EdgeSetDefaultSettingsCommand;
