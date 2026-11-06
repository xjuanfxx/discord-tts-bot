const { replaceEmojisWithNames } = require('./emojis');

const UNICODE_EMOJI_PATTERN = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
const CUSTOM_EMOJI_PATTERN = /<a?:(.*?):(\d{17,19})>/g;
const URL_PATTERN = /https?:\/\/[^\s]+/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\([^)]*\)?/g;
const USERS_PATTERN = /<@!?(\d+)>/g;
const CHANNELS_PATTERN = /<#(\d+)>/g;
const ROLES_PATTERN = /<@&(\d+)>/g;

// Mentions are replaced by the name of what they point to so the TTS reads "Juan" instead of nothing.
// If the entity is not cached (or no cache is given) the mention is simply removed.
const cleanMemberMentions = (message, members) => {
  return message.replace(USERS_PATTERN, (_, id) => members?.get(id)?.displayName ?? '');
};

const cleanChannelMentions = (message, channels) => {
  return message.replace(CHANNELS_PATTERN, (_, id) => channels?.get(id)?.name ?? '');
};

const cleanRoleMentions = (message, roles) => {
  return message.replace(ROLES_PATTERN, (_, id) => roles?.get(id)?.name ?? '');
};

const cleanEmojis = (message) => {
  return message
    .replace(CUSTOM_EMOJI_PATTERN, '')
    .replace(UNICODE_EMOJI_PATTERN, '');
};

const cleanLinks = (message) => {
  // Remove markdown links like [sticker name](url) first, then remaining bare URLs
  return message
    .replace(/<https?:\/\/[^\s]+>/g, '')
    .replace(MARKDOWN_LINK_PATTERN, '')
    .replace(URL_PATTERN, '');
};

/**
 * Cleans a message before sending it to the TTS.
 * @param {string} message
 * @param {object} options
 * @param {Collection} [options.members] Used to read user mentions by their display name.
 * @param {Collection} [options.channels] Used to read channel mentions by their name.
 * @param {Collection} [options.roles] Used to read role mentions by their name.
 * @param {boolean} [options.readEmojis] Whether emojis should be replaced by their name instead of removed.
 * @param {string} [options.language] The TTS language, used to pick the language of the emoji names.
 */
const cleanMessage = (message, { members, channels, roles, readEmojis = false, language } = {}) => {
  let clean = message;

  clean = cleanMemberMentions(clean, members);
  clean = cleanChannelMentions(clean, channels);
  clean = cleanRoleMentions(clean, roles);
  clean = readEmojis ? replaceEmojisWithNames(clean, language) : cleanEmojis(clean);
  clean = cleanLinks(clean);

  return clean;
};

module.exports = {
  cleanMessage,
  cleanMemberMentions,
  cleanChannelMentions,
  cleanRoleMentions,
  cleanEmojis,
  cleanLinks
};
