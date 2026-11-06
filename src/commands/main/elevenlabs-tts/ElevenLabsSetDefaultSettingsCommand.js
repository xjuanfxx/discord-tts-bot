const { PermissionsBitField } = require('discord.js');
const ElevenLabsSetVoiceBaseCommand = require('../../base/ElevenLabsSetVoiceBaseCommand');

class ElevenLabsSetDefaultSettingsCommand extends ElevenLabsSetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_set_default',
      description: 'Sets the voice to be used by the say and elevenlabs_say command by default.',
      group: 'elevenlabs-tts',
      userPermissions: [PermissionsBitField.Flags.ManageGuild]
    });
  }

  getEntity(interaction) {
    return interaction.guild;
  }

  getSuccessKey() {
    return 'command.elevenlabs.settings.default.voice.success';
  }
}

module.exports = ElevenLabsSetDefaultSettingsCommand;
