const path = require('path');
const { ConfigProvider } = require('@greencoast/discord.js-extended');
const { RedisDataProvider } = require('@greencoast/djs-extended-data-provider-redis');
const { LevelDataProvider } = require('@greencoast/djs-extended-data-provider-level');
const TTSClient = require('./classes/extensions/TTSClient');
const { locales } = require('./locales');
const { keepAlive } = require('./utils/keep-alive');
const { DISCONNECT_TIMEOUT, WEBSITE_URL } = require('./common/constants');
const { GatewayIntentBits } = require('discord.js');

const pkg = require('../package.json');

const SUPPORTED_PROVIDERS = ['level', 'redis'];

const validateUnitInterval = (name, value) => {
  if (isNaN(value) || value < 0 || value > 1) {
    throw new TypeError(`${name} must be a number between 0 and 1.`);
  }
};

const config = new ConfigProvider({
  configPath: path.join(__dirname, '../config/settings.json'),
  env: process.env,
  default: {
    PREFIX: '$',
    OWNER_ID: null,
    OWNER_REPORTING: false,
    PRESENCE_REFRESH_INTERVAL: 15 * 60 * 1000, // 15 Minutes
    DEFAULT_DISCONNECT_TIMEOUT: 5, // 5 Minutes,
    TESTING_GUILD_ID: null,
    PROVIDER_TYPE: 'level',
    REDIS_URL: null,
    ENABLE_TTS_CHANNELS: false,
    ENABLE_KEEP_ALIVE: false,
    ENABLE_WHO_SAID: false,
    MAX_MESSAGE_LENGTH: 0,
    ENABLE_EMOJI_NAMES: true,
    LEAVE_WHEN_ALONE: true,
    TTS_CHANNEL_IGNORE_PREFIX: '//',
    ELEVENLABS_API_KEY: null,
    ELEVENLABS_VOICE_ID: 'EXAVITQu4vr4xnSDxMaL',
    ELEVENLABS_MODEL_ID: 'eleven_v3',
    ELEVENLABS_LANGUAGE: 'en',
    ELEVENLABS_STABILITY: 0.75,
    ELEVENLABS_SIMILARITY_BOOST: 0.75,
    ELEVENLABS_STYLE: 0.3,
    ELEVENLABS_SPEAKER_BOOST: true,
    ELEVENLABS_OUTPUT_FORMAT: 'mp3_44100_128',
    ELEVENLABS_MAX_MESSAGE_LENGTH: 0
  },
  types: {
    TOKEN: 'string',
    PREFIX: 'string',
    OWNER_ID: ['string', 'null'],
    OWNER_REPORTING: 'boolean',
    PRESENCE_REFRESH_INTERVAL: ['number', 'null'],
    DEFAULT_DISCONNECT_TIMEOUT: 'number',
    TESTING_GUILD_ID: ['string', 'null'],
    PROVIDER_TYPE: 'string',
    REDIS_URL: ['string', 'null'],
    ENABLE_TTS_CHANNELS: 'boolean',
    ENABLE_KEEP_ALIVE: 'boolean',
    ENABLE_WHO_SAID: 'boolean',
    MAX_MESSAGE_LENGTH: 'number',
    ENABLE_EMOJI_NAMES: 'boolean',
    LEAVE_WHEN_ALONE: 'boolean',
    TTS_CHANNEL_IGNORE_PREFIX: ['string', 'null'],
    ELEVENLABS_API_KEY: ['string', 'null'],
    ELEVENLABS_VOICE_ID: 'string',
    ELEVENLABS_MODEL_ID: 'string',
    ELEVENLABS_LANGUAGE: 'string',
    ELEVENLABS_STABILITY: 'number',
    ELEVENLABS_SIMILARITY_BOOST: 'number',
    ELEVENLABS_STYLE: 'number',
    ELEVENLABS_SPEAKER_BOOST: 'boolean',
    ELEVENLABS_OUTPUT_FORMAT: 'string',
    ELEVENLABS_MAX_MESSAGE_LENGTH: 'number'
  },
  customValidators: {
    PROVIDER_TYPE: (value) => {
      if (!SUPPORTED_PROVIDERS.includes(value)) {
        throw new TypeError(`${value} is not a valid data provider, it must be one of ${SUPPORTED_PROVIDERS.join(', ')}`);
      }
    },
    ELEVENLABS_STABILITY: (value) => validateUnitInterval('ELEVENLABS_STABILITY', value),
    ELEVENLABS_SIMILARITY_BOOST: (value) => validateUnitInterval('ELEVENLABS_SIMILARITY_BOOST', value),
    ELEVENLABS_STYLE: (value) => validateUnitInterval('ELEVENLABS_STYLE', value),
    DEFAULT_DISCONNECT_TIMEOUT: (value) => {
      if (isNaN(value)) {
        throw new TypeError('DEFAULT_DISCONNECT_TIMEOUT must be a number!');
      }

      if (value > DISCONNECT_TIMEOUT.MAX || value < DISCONNECT_TIMEOUT.MIN) {
        throw new TypeError(`Invalid value for DEFAULT_DISCONNECT_TIMEOUT, it must be between ${DISCONNECT_TIMEOUT.MIN} and ${DISCONNECT_TIMEOUT.MAX}`);
      }
    }
  }
});

// Only request the intents that are actually used. MessageContent is a privileged intent, it is only
// needed to read the messages of the TTS channels.
const getIntents = () => {
  const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates];

  if (config.get('ENABLE_TTS_CHANNELS')) {
    intents.push(GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);
  }

  return intents;
};

const client = new TTSClient({
  config,
  debug: process.argv.includes('--debug'),
  errorOwnerReporting: config.get('OWNER_REPORTING'),
  owner: config.get('OWNER_ID'),
  prefix: config.get('PREFIX'),
  presence: {
    refreshInterval: config.get('PRESENCE_REFRESH_INTERVAL'),
    templates: [
      '{num_guilds} servers!',
      '/help for help.',
      '{num_members} users!',
      'up for {uptime}.',
      `current version: ${pkg.version}`,
      '{num_commands} commands available.',
      `visit ${WEBSITE_URL}`
    ]
  },
  testingGuildID: config.get('TESTING_GUILD_ID'),
  localizer: {
    defaultLocale: 'en',
    localeStrings: locales
  },
  intents: getIntents()
});

client
  .registerDefaultEvents()
  .registerExtraDefaultEvents();

client.registry
  .registerGroups([
    ['all-tts', 'All TTS Commands'],
    ['amazon-tts', 'Amazon TTS Commands'],
    ['config', 'Configuration Commands'],
    ['dictionary', 'Dictionary Commands'],
    ['google-tts', 'Google TTS Commands'],
    ['other-tts', 'Other TTS Commands'],
    ['misc', 'Miscellaneous Commands'],
    ['ms-tts', 'Microsoft TTS Commands'],
    ['elevenlabs-tts', 'ElevenLabs TTS Commands']
  ])
  .registerCommandsIn(path.join(__dirname, './commands/main'));

if (config.get('ENABLE_TTS_CHANNELS')) {
  client.registry.registerCommandsIn(path.join(__dirname, './commands/optional/channel-tts'));
}

const createProvider = (type) => {
  switch (type) {
    case 'level':
      return new LevelDataProvider(client, path.join(__dirname, '../data'));
    case 'redis':
      return new RedisDataProvider(client, { url: config.get('REDIS_URL') });
    default:
      throw new TypeError(`${type} is not a valid data provider, it must be one of ${SUPPORTED_PROVIDERS.join(', ')}`);
  }
};

client.once('ready', async () => {
  await client.setDataProvider(createProvider(config.get('PROVIDER_TYPE')));
  await client.initializeDependencies();
  await client.localizer.init();

  if (config.get('TESTING_GUILD_ID')) {
    client.deployer.rest.setToken(config.get('TOKEN'));
    await client.deployer.deployToTestingGuild();
  }

  if (config.get('ENABLE_TTS_CHANNELS')) {
    client.ttsChannelHandler.initialize();
  }

  if (config.get('LEAVE_WHEN_ALONE')) {
    client.voiceActivityHandler.initialize();
  }

  if (config.get('ENABLE_KEEP_ALIVE')) {
    keepAlive({ port: process.env.PORT || 3000 });
  }

  client.on('guildCreate', async (guild) => {
    await client.initializeDependenciesForGuild(guild);
  });

  client.on('guildDelete', async (guild) => {
    client.deleteDependenciesForGuild(guild);
    await client.dataProvider.clear(guild);
  });

  // This will be removed in a future update. Message contents are only received with the MessageContent intent.
  client.on('messageCreate', (message) => {
    if (!config.get('ENABLE_TTS_CHANNELS')) {
      return;
    }

    if (message.author.bot || !message.guild || !message.content.startsWith(client.prefix)) {
      return;
    }

    const args = message.content.slice(client.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    const command = client.registry.resolveCommand(commandName);

    if (command) {
      const localizer = client.localizer.getLocalizer(message.guild);
      return message.reply(localizer.t('app.message.deprecated', { commandName }))
        .catch((error) => {
          client.emit('error', error);
        });
    }
  });
});

client.login(config.get('TOKEN'));
