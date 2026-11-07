const SetVoiceBaseCommand = require('../../base/SetVoiceBaseCommand');
const FishProvider = require('../../../classes/tts/providers/FishProvider');

class FishSetMySettingsCommand extends SetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'fish_set_my',
      description: 'Sets the voice to be used by the say and fish_say commands for yourself.',
      group: 'fish-tts',
      providerName: FishProvider.NAME,
      localePrefix: 'fish',
      voiceDescription: 'The voice name or ID. Use /fish_voices to search for voices.'
    });
  }

  getEntity(interaction) {
    return interaction.member;
  }

  getSuccessKey() {
    return 'command.fish.settings.my.voice.success';
  }
}

module.exports = FishSetMySettingsCommand;
