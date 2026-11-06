const { PermissionsBitField } = require('discord.js');
const ElevenLabsSetVoiceBaseCommand = require('../../../base/ElevenLabsSetVoiceBaseCommand');

class ElevenLabsSetChannelSettingsCommand extends ElevenLabsSetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'elevenlabs_set_channel',
      description: 'Sets the voice to be used by the message-only based TTS on this channel.',
      group: 'elevenlabs-tts',
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
