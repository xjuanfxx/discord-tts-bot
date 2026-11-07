const { PermissionsBitField } = require('discord.js');
const SetVoiceBaseCommand = require('../../base/SetVoiceBaseCommand');
const FishProvider = require('../../../classes/tts/providers/FishProvider');

class FishSetDefaultSettingsCommand extends SetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'fish_set_default',
      description: 'Sets the voice to be used by the say and fish_say commands by default.',
      group: 'fish-tts',
      userPermissions: [PermissionsBitField.Flags.ManageGuild],
      providerName: FishProvider.NAME,
      localePrefix: 'fish',
      voiceDescription: 'The voice name or ID. Use /fish_voices to search for voices.'
    });
  }

  getEntity(interaction) {
    return interaction.guild;
  }

  getSuccessKey() {
    return 'command.fish.settings.default.voice.success';
  }
}

module.exports = FishSetDefaultSettingsCommand;
