const { MessageMentions: { USERS_PATTERN, CHANNELS_PATTERN, ROLES_PATTERN } } = require('discord.js');

const CUSTOM_EMOJI_PATTERN = /<:.*?:(\d{17,19})>/g;

const cleanMemberMentions = (message, members) => {
  return message.replace(USERS_PATTERN, (_, id) => members.get(id).displayName);
};

const cleanChannelMentions = (message, channels) => {
  return message.replace(CHANNELS_PATTERN, (_, id) => channels.get(id).name);
};

const cleanRoleMentions = (message, roles) => {
  return message.replace(ROLES_PATTERN, (_, id) => roles.get(id).name);
};

const cleanEmojis = (message, emojis) => {
  return message.replace(CUSTOM_EMOJI_PATTERN, (_, id) => emojis.get(id).name);
};

const cleanMessage = (message, { members, channels, roles, emojis }) => {
  let clean = message;

  clean = cleanMemberMentions(clean, members);
  clean = cleanChannelMentions(clean, channels);
  clean = cleanRoleMentions(clean, roles);
  clean = cleanEmojis(clean, emojis);

  return clean;
};

module.exports = {
  cleanMessage,
  cleanMemberMentions,
  cleanChannelMentions,
  cleanRoleMentions,
  cleanEmojis
};