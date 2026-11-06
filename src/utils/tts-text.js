const { cleanMessage, cleanEmojis } = require('./mentions');

/**
 * Builds the final text that will be spoken: applies the guild dictionary, cleans mentions, emojis and links
 * and prepends the localized "{name} said" intro if ENABLE_WHO_SAID is on.
 * @param {TTSClient} client
 * @param {object} options
 * @param {Discord.GuildMember} options.member The author of the message.
 * @param {string} options.content The raw message.
 * @param {object} options.extras The provider settings, used for the language.
 * @param {Collection} [options.mentionedMembers] Members resolved by Discord for this message (message.mentions.members),
 * needed because mentioned members are not always in the guild cache.
 * @returns {Promise<string>} The text to say. May be empty.
 */
const buildTTSText = async (client, { member, content, extras, mentionedMembers }) => {
  const { guild } = member;
  const localizer = client.localizer.getLocalizer(guild);

  const cleaned = cleanMessage(content, {
    members: mentionedMembers ? guild.members.cache.concat(mentionedMembers) : guild.members.cache,
    channels: guild.channels.cache,
    roles: guild.roles.cache,
    readEmojis: client.config.get('ENABLE_EMOJI_NAMES'),
    language: extras?.language
  });

  const text = (await client.guildDictionary.apply(guild, cleaned)).trim();
  if (text.length === 0) {
    return '';
  }

  return client.config.get('ENABLE_WHO_SAID') ?
    `${localizer.t('tts.who_said', { name: cleanEmojis(member.displayName).trim() })} ${text}` :
    text;
};

const GUILD_MAX_LENGTH_KEY = 'maxMessageLength';

/**
 * Gets the max message length set in the bot config for a provider. Providers may have their own limit
 * (e.g. ELEVENLABS_MAX_MESSAGE_LENGTH, since it is a paid API), otherwise MAX_MESSAGE_LENGTH is used.
 * @param {ConfigProvider} config
 * @param {string} providerName
 * @returns {number} 0 means no limit.
 */
const getConfigMaxMessageLength = (config, providerName) => {
  const specific = config.get(`${providerName.toUpperCase()}_MAX_MESSAGE_LENGTH`) || 0;

  return specific > 0 ? specific : config.get('MAX_MESSAGE_LENGTH') || 0;
};

/**
 * Gets the max message length a guild has set with /set_max_length.
 * @returns {Promise<number>} 0 means the guild has no limit of its own.
 */
const getGuildMaxMessageLength = async (client, guild) => {
  return await client.dataProvider.get(guild, GUILD_MAX_LENGTH_KEY, 0) || 0;
};

const setGuildMaxMessageLength = (client, guild, length) => {
  return client.dataProvider.set(guild, GUILD_MAX_LENGTH_KEY, length);
};

/**
 * Gets the effective max message length: the smallest between the guild limit and the config limit.
 * The config limit is a hard cap set by the bot owner, guilds can only lower it.
 * @param {TTSClient} client
 * @param {Discord.Guild} guild
 * @param {string} providerName
 * @returns {Promise<number>} 0 means no limit.
 */
const getMaxMessageLength = async (client, guild, providerName) => {
  const limits = [
    getConfigMaxMessageLength(client.config, providerName),
    await getGuildMaxMessageLength(client, guild)
  ].filter((limit) => limit > 0);

  return limits.length > 0 ? Math.min(...limits) : 0;
};

module.exports = {
  buildTTSText,
  getMaxMessageLength,
  getConfigMaxMessageLength,
  getGuildMaxMessageLength,
  setGuildMaxMessageLength
};
