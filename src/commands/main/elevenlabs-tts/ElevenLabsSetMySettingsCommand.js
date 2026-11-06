const ElevenLabsSetVoiceBaseCommand = require('../../base/ElevenLabsSetVoiceBaseCommand');

class ElevenLabsSetMySettingsCommand extends ElevenLabsSetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_set_my',
      description: 'Sets the voice to be used by the say and elevenlabs_say command for yourself.',
      group: 'elevenlabs-tts'
    });
  }

  getEntity(interaction) {
    return interaction.member;
  }

  getSuccessKey() {
    return 'command.elevenlabs.settings.my.voice.success';
  }
}

module.exports = ElevenLabsSetMySettingsCommand;
