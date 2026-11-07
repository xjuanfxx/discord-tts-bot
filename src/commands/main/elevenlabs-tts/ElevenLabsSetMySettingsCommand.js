const SetVoiceBaseCommand = require('../../base/SetVoiceBaseCommand');
const ElevenLabsProvider = require('../../../classes/tts/providers/ElevenLabsProvider');

class ElevenLabsSetMySettingsCommand extends SetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_set_my',
      description: 'Sets the voice to be used by the say and elevenlabs_say command for yourself.',
      group: 'elevenlabs-tts',
      providerName: ElevenLabsProvider.NAME,
      localePrefix: 'elevenlabs',
      voiceDescription: 'The voice name or ID. Use /elevenlabs_voices to see the available voices.'
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
