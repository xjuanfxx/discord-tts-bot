const { PermissionsBitField } = require('discord.js');
const SetVoiceBaseCommand = require('../../base/SetVoiceBaseCommand');
const ElevenLabsProvider = require('../../../classes/tts/providers/ElevenLabsProvider');

class ElevenLabsSetDefaultSettingsCommand extends SetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_set_default',
      description: 'Sets the voice to be used by the say and elevenlabs_say command by default.',
      group: 'elevenlabs-tts',
      providerName: ElevenLabsProvider.NAME,
      localePrefix: 'elevenlabs',
      voiceDescription: 'The voice name or ID. Use /elevenlabs_voices to see the available voices.',
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
