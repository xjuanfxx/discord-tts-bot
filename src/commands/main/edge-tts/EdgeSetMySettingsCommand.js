const EdgeSetSettingsBaseCommand = require('../../base/EdgeSetSettingsBaseCommand');

class EdgeSetMySettingsCommand extends EdgeSetSettingsBaseCommand {
  constructor(client) {
    super(client, {
      name: 'edge_set_my',
      description: 'Sets the settings to be used by the say and edge_say commands for yourself.',
      group: 'edge-tts'
    });
  }

  getEntity(interaction) {
    return interaction.member;
  }

  getSuccessKey() {
    return 'command.edge.settings.my.success';
  }
}

module.exports = EdgeSetMySettingsCommand;
