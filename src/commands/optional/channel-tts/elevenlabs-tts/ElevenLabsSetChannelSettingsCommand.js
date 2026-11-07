const { PermissionsBitField } = require('discord.js');
const SetVoiceBaseCommand = require('../../../base/SetVoiceBaseCommand');
const ElevenLabsProvider = require('../../../../classes/tts/providers/ElevenLabsProvider');

class ElevenLabsSetChannelSettingsCommand extends SetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_set_channel',
      description: 'Sets the voice to be used by the message-only based TTS on this channel.',
      group: 'elevenlabs-tts',
      providerName: ElevenLabsProvider.NAME,
      localePrefix: 'elevenlabs',
      voiceDescription: 'The voice name or ID. Use /elevenlabs_voices to see the available voices.',
      userPermissions: [PermissionsBitField.Flags.ManageChannels]
    });
  }

  getEntity(interaction) {
    return interaction.channel;
  }

  getSuccessKey() {
    return 'channel_commands.elevenlabs.settings.voice.success';
  }
}

module.exports = ElevenLabsSetChannelSettingsCommand;
