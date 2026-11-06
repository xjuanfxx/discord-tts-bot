const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const logger = require('@greencoast/logger');
const ElevenLabsProvider = require('../../classes/tts/providers/ElevenLabsProvider');

/**
 * Base for /elevenlabs_set_my, /elevenlabs_set_default and /elevenlabs_set_channel.
 * Concrete commands only need to say which entity (member, guild or channel) the voice is saved for.
 */
class ElevenLabsSetVoiceBaseCommand extends SlashCommand {
  constructor(client, options) {
    super(client, {
      ...options,
      emoji: ':pencil2:',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addSubcommand((input) => {
          return input
            .setName('voice')
            .setDescription(options.description)
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The voice name or ID. Use /elevenlabs_voices to see the available voices.')
                .setRequired(true);
            });
        })
    });
  }

  /**
   * @param {Discord.CommandInteraction} interaction
   * @returns {Discord.GuildMember|Discord.Guild|Discord.BaseChannel}
   */
  getEntity() {
    throw new Error('getEntity() not implemented!');
  }

  /**
   * @returns {string} The locale key used for the success message.
   */
  getSuccessKey() {
    throw new Error('getSuccessKey() not implemented!');
  }

  async run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const provider = this.client.providerManager.getProvider(ElevenLabsProvider.NAME);

    if (!provider.isAvailable()) {
      return interaction.reply({ content: localizer.t('command.say.provider_unavailable', { name: ElevenLabsProvider.NAME }), flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const query = interaction.options.getString('value');
    const voice = await provider.findVoice(query);

    if (!voice) {
      return interaction.editReply(localizer.t('command.elevenlabs.settings.voice.unsupported', { voice: query }));
    }

    await this.client.ttsSettings.set(this.getEntity(interaction), {
      [ElevenLabsProvider.NAME]: { voice: voice.id, voiceName: voice.name }
    });

    logger.info(`${this.name} in ${interaction.guild.name} (by ${interaction.member.displayName}) set the ElevenLabs voice to ${voice.name} (${voice.id}).`);
    return interaction.editReply(localizer.t(this.getSuccessKey(), { voice: voice.name }));
  }
}

module.exports = ElevenLabsSetVoiceBaseCommand;
