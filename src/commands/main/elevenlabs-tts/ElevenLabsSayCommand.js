const SayBaseCommand = require('../../base/SayBaseCommand');
const ElevenLabsProvider = require('../../../classes/tts/providers/ElevenLabsProvider');

class ElevenLabsSayCommand extends SayBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_say',
      description: 'Send an ElevenLabs AI TTS message in your voice channel.',
      emoji: ':speaking_head:',
      group: 'elevenlabs-tts'
    });
  }

  getProviderName() {
    return ElevenLabsProvider.NAME;
  }
}

module.exports = ElevenLabsSayCommand;
