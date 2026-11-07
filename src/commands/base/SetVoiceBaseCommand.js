const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const logger = require('@greencoast/logger');

/**
 * Base for the commands that set the voice of a provider whose voices come from an API (ElevenLabs, Fish Audio...)
 * for a member, a guild or a channel. The provider must implement findVoice(query, language).
 * Concrete commands say which entity the voice is saved for and which locale key to reply with.
 */
class SetVoiceBaseCommand extends SlashCommand {
  /**
   * @param {TTSClient} client
   * @param {object} options The SlashCommand options plus:
   * @param {string} options.providerName The NAME of the provider.
   * @param {string} options.localePrefix e.g. "elevenlabs" for command.elevenlabs.settings.voice.unsupported.
   * @param {string} options.voiceDescription Description of the voice option.
   */
  constructor(client, options) {
    const { providerName, localePrefix, voiceDescription, ...commandOptions } = options;

    super(client, {
      ...commandOptions,
      emoji: ':pencil2:',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addSubcommand((input) => {
          return input
            .setName('voice')
            .setDescription(commandOptions.description)
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription(voiceDescription)
                .setRequired(true);
            });
        })
    });

    this.providerName = providerName;
    this.localePrefix = localePrefix;
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
    const provider = this.client.providerManager.getProvider(this.providerName);

    if (!provider.isAvailable()) {
      return interaction.reply({ content: localizer.t('command.say.provider_unavailable', { name: this.providerName }), flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const query = interaction.options.getString('value');
    const current = await this.client.ttsSettings.getCurrent(interaction);
    const voice = await provider.findVoice(query, current[this.providerName]?.language);

    if (!voice) {
      return interaction.editReply(localizer.t(`command.${this.localePrefix}.settings.voice.unsupported`, { voice: query }));
    }

    await this.client.ttsSettings.set(this.getEntity(interaction), {
      [this.providerName]: {
        voice: voice.id,
        voiceName: voice.name,
        // Used to read the emoji names in the language of the voice.
        ...voice.languages?.[0] ? { language: voice.languages[0] } : {}
      }
    });

    logger.info(`${this.name} in ${interaction.guild.name} (by ${interaction.member.displayName}) set the ${this.providerName} voice to ${voice.name} (${voice.id}).`);
    return interaction.editReply(localizer.t(this.getSuccessKey(), { voice: voice.name }));
  }
}

module.exports = SetVoiceBaseCommand;
