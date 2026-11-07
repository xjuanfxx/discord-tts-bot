const SayBaseCommand = require('../../base/SayBaseCommand');
const FishProvider = require('../../../classes/tts/providers/FishProvider');

class FishSayCommand extends SayBaseCommand {
  constructor(client) {
    super(client, {
      name: 'fish_say',
      description: 'Send a Fish Audio TTS message in your voice channel.',
      emoji: ':speaking_head:',
      group: 'fish-tts'
    });
  }

  getProviderName() {
    return FishProvider.NAME;
  }
}

module.exports = FishSayCommand;
