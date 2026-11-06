const MESSAGE_EMBED = {
  color: '#ff8e56',
  langThumbnail: 'https://i.imgur.com/QbNXO4q.jpg',
  googleLangURL: 'https://docs.moonstar-x.dev/discord-tts-bot/text-to-speech-providers/google-translate/#language-support',
  amazonLangURL: 'https://docs.moonstar-x.dev/discord-tts-bot/text-to-speech-providers/amazon-ttstool/#language-support',
  microsoftLangURL: 'https://docs.moonstar-x.dev/discord-tts-bot/text-to-speech-providers/microsoft-ttstool/#language-support',
  helpThumbnail: 'https://i.imgur.com/kzy3cTK.png',
  helpURL: 'https://github.com/moonstar-x/discord-tts-bot/issues'
};

const EMBED_FIELD_MAX_SIZE = 1024;

const DISCONNECT_TIMEOUT = {
  MIN: 5,
  MAX: 300
};

// Time to wait before leaving a voice channel once the bot is left alone in it.
const ALONE_LEAVE_DELAY = 15 * 1000;

const WEBSITE_URL = 'https://docs.moonstar-x.dev/discord-tts-bot/';

module.exports = {
  MESSAGE_EMBED,
  EMBED_FIELD_MAX_SIZE,
  DISCONNECT_TIMEOUT,
  ALONE_LEAVE_DELAY,
  WEBSITE_URL
};
