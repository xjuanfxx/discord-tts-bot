const { PermissionsBitField } = require('discord.js');
const SetVoiceBaseCommand = require('../../../base/SetVoiceBaseCommand');
const FishProvider = require('../../../../classes/tts/providers/FishProvider');

class FishSetChannelSettingsCommand extends SetVoiceBaseCommand {
  constructor(client) {
    super(client, {
      name: 'fish_set_channel',
      description: 'Sets the voice to be used by the message-only based TTS on this channel.',
      group: 'fish-tts',
      userPermissions: [PermissionsBitField.Flags.ManageChannels],
      providerName: FishProvider.NAME,
      localePrefix: 'fish',
      voiceDescription: 'The voice name or ID. Use /fish_voices to search for voices.'
    });
  }

  getEntity(interaction) {
    return interaction.channel;
  }

  getSuccessKey() {
    return 'channel_commands.fish.settings.voice.success';
  }
}

module.exports = FishSetChannelSettingsCommand;
