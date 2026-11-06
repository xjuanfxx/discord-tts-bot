const SayBaseCommand = require('../../base/SayBaseCommand');
const EdgeProvider = require('../../../classes/tts/providers/EdgeProvider');

class EdgeSayCommand extends SayBaseCommand {
  constructor(client) {
    super(client, {
      name: 'edge_say',
      description: 'Send a Microsoft Edge (neural voices) TTS message in your voice channel.',
      emoji: ':speaking_head:',
      group: 'edge-tts'
    });
  }

  getProviderName() {
    return EdgeProvider.NAME;
  }
}

module.exports = EdgeSayCommand;
