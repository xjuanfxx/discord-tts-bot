const CUSTOM_EMOJI_PATTERN = /<a?:(.*?):(\d{17,19})>/g;
const URL_PATTERN = /https?:\/\/[^\s]+/g;
const USERS_PATTERN = /<@!?(\d+)>/g;
const CHANNELS_PATTERN = /<#(\d+)>/g;
const ROLES_PATTERN = /<@&(\d+)>/g;

const cleanMemberMentions = (message, members) => {
  return message.replace(USERS_PATTERN, '');
};

const cleanChannelMentions = (message, channels) => {
  return message.replace(CHANNELS_PATTERN, '');
};

const cleanRoleMentions = (message, roles) => {
  return message.replace(ROLES_PATTERN, '');
};

const cleanEmojis = (message) => {
  return message.replace(CUSTOM_EMOJI_PATTERN, (_, name) => name);
};

const cleanLinks = (message) => {
  // Also clean discord's angle brackets around URLs if present
  return message.replace(/<https?:\/\/[^\s]+>/g, '').replace(URL_PATTERN, '');
};

const cleanMessage = (message, { members, channels, roles }) => {
  let clean = message;

  clean = cleanMemberMentions(clean, members);
  clean = cleanChannelMentions(clean, channels);
  clean = cleanRoleMentions(clean, roles);
  clean = cleanEmojis(clean);
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
