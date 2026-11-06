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

module.exports = {
  buildTTSText
};
