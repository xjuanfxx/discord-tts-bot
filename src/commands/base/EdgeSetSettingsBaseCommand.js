const { SlashCommand } = require('@greencoast/discord.js-extended');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageFlags } = require('discord.js');
const logger = require('@greencoast/logger');
const EdgeProvider = require('../../classes/tts/providers/EdgeProvider');

/**
 * Base for /edge_set_my, /edge_set_default and /edge_set_channel.
 * Concrete commands only need to say which entity (member, guild or channel) the settings are saved for.
 */
class EdgeSetSettingsBaseCommand extends SlashCommand {
  constructor(client, options) {
    super(client, {
      ...options,
      emoji: ':pencil2:',
      guildOnly: true,
      dataBuilder: new SlashCommandBuilder()
        .addSubcommand((input) => {
          return input
            .setName('voice')
            .setDescription('Sets the Edge voice. Use /edge_voices to see the available voices.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The voice name (e.g. Dalia) or ID (e.g. es-MX-DaliaNeural).')
                .setRequired(true);
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('rate')
            .setDescription('Sets how fast the Edge voice speaks.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The rate to use from now.')
                .setRequired(true)
                .setChoices(...EdgeProvider.getSupportedRateChoices());
            });
        })
        .addSubcommand((input) => {
          return input
            .setName('pitch')
            .setDescription('Sets the pitch of the Edge voice.')
            .addStringOption((input) => {
              return input
                .setName('value')
                .setDescription('The pitch to use from now.')
                .setRequired(true)
                .setChoices(...EdgeProvider.getSupportedPitchChoices());
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

  async handleVoice(interaction, localizer) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const provider = this.client.providerManager.getProvider(EdgeProvider.NAME);
    const current = await this.client.ttsSettings.getCurrent(interaction);
    const query = interaction.options.getString('value');
    const voice = await provider.findVoice(query, current[EdgeProvider.NAME]?.language);

    if (!voice) {
      return interaction.editReply(localizer.t('command.edge.settings.voice.unsupported', { voice: query }));
    }

    await this.save(interaction, { voice: voice.id, language: EdgeProvider.getVoiceLanguage(voice.id) });
    return interaction.editReply(localizer.t(this.getSuccessKey(), { setting: localizer.t('command.edge.setting.voice'), value: `${voice.name} (${voice.id})` }));
  }

  async handleChoice(interaction, localizer, setting) {
    const value = interaction.options.getString('value');

    await this.save(interaction, { [setting]: value });
    return interaction.reply({ content: localizer.t(this.getSuccessKey(), { setting: localizer.t(`command.edge.setting.${setting}`), value }), flags: MessageFlags.Ephemeral });
  }

  async save(interaction, settings) {
    await this.client.ttsSettings.set(this.getEntity(interaction), { [EdgeProvider.NAME]: settings });
    logger.info(`${this.name} in ${interaction.guild.name} (by ${interaction.member.displayName}) changed the Edge settings: ${JSON.stringify(settings)}.`);
  }

  run(interaction) {
    const localizer = this.client.localizer.getLocalizer(interaction.guild);
    const subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case 'voice':
        return this.handleVoice(interaction, localizer);
      case 'rate':
      case 'pitch':
        return this.handleChoice(interaction, localizer, subCommand);
      default:
        throw new Error(`Invalid subcommand ${subCommand} supplied to ${this.name}.`);
    }
  }
}

module.exports = EdgeSetSettingsBaseCommand;
