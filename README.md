![banner](https://i.imgur.com/HT7Wmv1.jpg)

[![ci-build-status](https://img.shields.io/github/actions/workflow/status/xjuanfxx/discord-tts-bot/ci.yml?branch=master&logo=github)](https://github.com/xjuanfxx/discord-tts-bot/actions)
[![open-issues-count](https://img.shields.io/github/issues-raw/xjuanfxx/discord-tts-bot?logo=github)](https://github.com/xjuanfxx/discord-tts-bot/issues)

# Discord TTS Bot

This is a simple TTS Bot that uses the Google Translate TTS API. With this bot you can send Text-to-Speech messages in multiple languages using Google Translate or other TTS engines (Amazon, Microsoft, aeiou and ElevenLabs AI).

> This is a fork of [moonstar-x/discord-tts-bot](https://github.com/moonstar-x/discord-tts-bot) with extra features and fixes. For the documentation of the original bot, visit its [official page](https://docs.moonstar-x.dev/discord-tts-bot/).

## What's new in this fork

* **ElevenLabs AI provider**: realistic AI voices with `/elevenlabs_say`. Everything (API key, voice, model, voice settings, character limit) is set from the [configuration](#configuration). See [ElevenLabs](#elevenlabs).
* **Emojis are read out loud by their name** in the language of the voice: 😎 → *"cara sonriendo con gafas de sol"* (es) / *"smiling face with sunglasses"* (en). Custom server emojis are read by their name, skin tones are omitted and repeated emojis are only read once.
* **Mentions are read by name**: `@Juan`, `#general` and `@Mods` instead of being skipped.
* **Per-server dictionary**: make the bot read words in a different way, e.g. `xd` → `equis de` (`/dictionary_add`, `/dictionary_remove`, `/dictionary_list`).
* **Character limits**: a global limit (`max_message_length`), a per-provider limit (`elevenlabs_max_message_length`) and a per-server limit with `/set_max_length` that can never go above the global one.
* **`/skip`** skips the message that is being said.
* **Leaves the voice channel when everyone else leaves** (`leave_when_alone`).
* **Ignore prefix for TTS channels**: messages starting with `//` are not read (`tts_channel_ignore_prefix`).
* The *"User said"* intro is translated (*"Juan dijo"*, *"Juan a dit"*).
* **Hardened voice connection**: the bot joins self-deafened (but not muted), uses Discord's end-to-end encrypted voice (DAVE), recovers when moved between channels, cleans up when kicked, never hangs when it can't connect, tells you when it has been server muted and can speak in stage channels.
* **Follows Discord's guidelines**: only requests the privileged *Message Content* intent when TTS channels are enabled, doesn't keep message contents in the logs (only in debug mode) and doesn't spam warning replies in TTS channels.

## Requirements

To self-host this bot you'll need the following:

* [git](https://git-scm.com/)
* [node.js](https://nodejs.org/en/) (Version 22.12.0 or higher, required by `@discordjs/voice`)
* ffmpeg

**ffmpeg** should be installed by default on Linux and MacOS, in case it isn't, install it with your package manager. For Windows users, head over to [ffmpeg's official website](https://www.ffmpeg.org/download.html#build-windows) to download the binary which will need to be added to your **\$PATH**. If you don't know how to add folders to your **\$PATH**, check out this [guide](https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/).

You may also try installing it with:

```text
npm install ffmpeg-static
```

## Installation

In order to self-host this bot, first you'll need to clone this repository.

```text
git clone https://github.com/xjuanfxx/discord-tts-bot.git
```

Install the dependencies with:

```text
npm ci --omit=dev
```

Or, if you want to also install the `devDependencies`:

```text
npm install
```

After you have [configured](#configuration) the bot, you should deploy the slash commands by running:

```text
npm run deploy
```

Then, you can run your bot with:

```text
npm start
```

In case your bot is in a lot of servers (more than 2000), you should shard your bot. You can start a sharded client with:

```text
npm run start-sharded
```

## Updating

In order to update this bot, you should pull the latest changes:

```text
git pull origin master
```

And re-install the dependencies:

```text
rm -rf node_modules && npm install
```

Once this is done, you should re-deploy the commands:

```text
npm run deploy
```

And you're ready to go. Make sure you check the README everytime you wish to update in case there are breaking changes
that may affect your current installation.

### Upgrading from 4.2.x to 4.3.0

* **Node.js 22.12 or newer is now required** (it's required by `@discordjs/voice`, which handles Discord's encrypted voice). Check your version with `node -v` before updating.
* Run `npm install` (there are new dependencies) and `npm run deploy` (there are new commands).
* The new settings are optional, your current `settings.json` keeps working. If you already had `elevenlabs_api_key`, it is used as is.
* Emojis are now read by their name. Set `enable_emoji_names` to `false` to keep skipping them.

## Creating your Bot Token

Head over to [Discord Application Page](https://discord.com/developers/applications/) and create a new bot. Then, you should enable it as a bot
by going into the `Bot` page and setting up your bot. Then, you should head over to the `OAuth2` page and select `OAuth2 URL Generator`. A box should show up
with plenty of checkboxes, enable the `bot` and `application.commands` checkboxes. Then, another box should show up with more checkboxes, enable the following ones:

* Send Messages
* Read Message History
* Connect
* Speak

If you want the bot to talk in stage channels, also give it the *Mute Members* permission (or a moderator will have to accept its request to speak).

> The bot only needs the privileged **Message Content** intent if you enable `enable_tts_channels`. You can leave it disabled otherwise.

At the bottom a link should show up, access this link to invite your bot. You should send this link to anyone that wishes to add your bot to their Discord server.

## Configuration

Inside the `config` folder, rename the file *settings.json.example* to *settings.json* and edit the file with your own Discord Token and other settings. If you don't have a discord token yet, you can see a guide on how to create it [here](https://github.com/moonstar-x/discord-downtime-notifier/wiki).

Your file should look like this.

```json
{
  "token": "YOUR_DISCORD_TOKEN",
  "prefix": "$",
  "owner_id": "123123123",
  "owner_reporting": false,
  "presence_refresh_interval": 600000,
  "default_disconnect_timeout": 5,
  "testing_guild_id": null,
  "provider_type": "level",
  "redis_url": "redis://ip:port",
  "enable_tts_channels": false,
  "enable_keep_alive": false,
  "enable_who_said": false,
  "max_message_length": 0,
  "enable_emoji_names": true,
  "leave_when_alone": true,
  "tts_channel_ignore_prefix": "//",
  "elevenlabs_api_key": null,
  "elevenlabs_voice_id": "EXAVITQu4vr4xnSDxMaL",
  "elevenlabs_model_id": "eleven_v3",
  "elevenlabs_language": "en",
  "elevenlabs_stability": 0.75,
  "elevenlabs_similarity_boost": 0.75,
  "elevenlabs_style": 0.3,
  "elevenlabs_speaker_boost": true,
  "elevenlabs_output_format": "mp3_44100_128",
  "elevenlabs_max_message_length": 0
}
```

You may also configure these options with environment variables. The settings set with the environment variables will take higher precedence than the ones in the config JSON file.

This table contains all the configuration settings you may specify with both environment variables and the JSON config file.

| Environment Variable               | JSON Property                | Required                    | Type                       | Description                                                                                                                                                                                                                                                                                                                                                                          |
|------------------------------------|------------------------------|-----------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DISCORD_TOKEN                      | `token`                      | Yes.                        | `string`                   | The bot's token.                                                                                                                                                                                                                                                                                                                                                                     |
| DISCORD_PREFIX                     | `prefix`                     | No. (Defaults to: `$`)      | `string`                   | **Deprecated**: The bot's prefix. A prefix is no longer necessary because this bot uses the all new interactions (slash commands).                                                                                                                                                                                                                                                   |
| DISCORD_OWNER_ID                   | `owner_id`                   | No. (Defaults to: `null`)   | `string` or `null`         | The ID of the bot's owner.                                                                                                                                                                                                                                                                                                                                                           |
| DISCORD_OWNER_REPORTING            | `owner_reporting`            | No. (Defaults to: `false`)  | `boolean`                  | Whether the bot should send error reports to the owner via DM when a command errors.                                                                                                                                                                                                                                                                                                 |
| DISCORD_PRESENCE_REFRESH_INTERVAL  | `presence_refresh_interval`  | No. (Defaults to: `900000`) | `number` or `null`         | The time interval in milliseconds in which the bot updates its presence. If set to `null` the presence auto update will be disabled.                                                                                                                                                                                                                                                 |
| DISCORD_DEFAULT_DISCONNECT_TIMEOUT | `default_disconnect_timeout` | No. (Defaults to: `5`)      | `number` or `null`         | The time it takes the bot to leave a voice channel when inactive by default on all servers. This setting can be customised per server and this will be used if a server has not set their own value.                                                                                                                                                                                 |
| DISCORD_TESTING_GUILD_ID           | `testing_guild_id`           | No. (Defaults to: `null`)   | `string` or `null`         | The ID of the testing guild. You do not need to set this to anything if you're not planning on developing the bot.                                                                                                                                                                                                                                                                   |
| DISCORD_PROVIDER_TYPE              | `provider_type`              | No. (Defaults to: `level`)  | Can be: `level` or `redis` | The type of data provider to use. [Level](https://github.com/google/leveldb) is a file based key-value store whereas [Redis](https://redis.io/) is a cache service. If you plan on just hosting the bot for a small server you should choose `level`, if you plan on sharding the client `redis` can be a better choice.                                                             |
| DISCORD_REDIS_URL                  | `redis_url`                  | No. (Defaults to: `null`)   | `string` or `null`         | The URL of the redis service. This is only required if you have set the provider type to `redis`.                                                                                                                                                                                                                                                                                    |
| DISCORD_ENABLE_TTS_CHANNELS        | `enable_tts_channels`        | No. (Defaults to: `false`)  | `boolean`                  | Whether to enable the message-only TTS for specific channels. With this setting, you can send TTS messages by just sending messages to a channel that you have enabled a provider for. You need the privileged message intent (accessible in the `Bot` page of your bot's application page) for this feature to work properly.                                                       |
| DISCORD_ENABLE_KEEP_ALIVE          | `enable_keep_alive`          | No. (Defaults to: `false`)  | `boolean`                  | Whether an HTTP server should be started. You should only use this option if you're planning to host the bot on something like Repl.it or Heroku. Additionally, you should use something like UptimeRobot to poll the associated address to keep the bot alive. If you need to specify the port to use you should set the `PORT` environment variable (Heroku uses this by default). |
| DISCORD_ENABLE_WHO_SAID            | `enable_who_said`            | No. (Defaults to: `false`)  | `boolean`                  | Whether the bot should prepend each TTS message with a 'User said...' (translated to the server's locale). This makes it so the bot speaks the name of the author of every message.                                                                                                                                                                                                                                      |
| DISCORD_MAX_MESSAGE_LENGTH         | `max_message_length`         | No. (Defaults to: `0`)      | `number`                   | The maximum number of characters allowed per TTS message. Servers can set a lower limit with `/set_max_length`, but never a higher one. If set to `0` the limit is disabled. In TTS channels the message will be truncated; in slash commands the bot will reject the message with an error.                                                                                                                                                                       |
| DISCORD_ENABLE_EMOJI_NAMES         | `enable_emoji_names`         | No. (Defaults to: `true`)   | `boolean`                  | Whether the bot should read emojis out loud by their name (e.g. 😎 is read as *smiling face with sunglasses*, or *cara sonriendo con gafas de sol* in Spanish) instead of skipping them. The language of the name follows the TTS language. Custom server emojis are read by their name and repeated consecutive emojis are only read once. |
| DISCORD_LEAVE_WHEN_ALONE           | `leave_when_alone`           | No. (Defaults to: `true`)   | `boolean`                  | Whether the bot should leave its voice channel (15 seconds) after everyone else has left it, instead of waiting for the inactivity timeout. |
| DISCORD_TTS_CHANNEL_IGNORE_PREFIX  | `tts_channel_ignore_prefix`  | No. (Defaults to: `//`)     | `string` or `null`         | Messages in TTS channels that start with this prefix are not read out loud. Set it to `null` to read every message. |
| DISCORD_ELEVENLABS_API_KEY         | `elevenlabs_api_key`         | No. (Defaults to: `null`)   | `string` or `null`         | Your [ElevenLabs](https://elevenlabs.io) API key. The ElevenLabs provider and its commands only work when this is set. |
| DISCORD_ELEVENLABS_VOICE_ID        | `elevenlabs_voice_id`        | No. (Defaults to: `EXAVITQu4vr4xnSDxMaL`) | `string`                   | The voice used when neither the user, the channel nor the server picked one. Use `/elevenlabs_voices` to get the IDs. |
| DISCORD_ELEVENLABS_MODEL_ID        | `elevenlabs_model_id`        | No. (Defaults to: `eleven_v3`) | `string`                   | The ElevenLabs model. `eleven_flash_v2_5` is faster and cheaper, `eleven_multilingual_v2` / `eleven_v3` sound better. |
| DISCORD_ELEVENLABS_LANGUAGE        | `elevenlabs_language`        | No. (Defaults to: `en`)     | `string`                   | The language of your voices (e.g. `es`). Only used to read emoji names in the right language. |
| DISCORD_ELEVENLABS_STABILITY       | `elevenlabs_stability`       | No. (Defaults to: `0.75`)   | `number` (0 - 1)           | Voice stability. |
| DISCORD_ELEVENLABS_SIMILARITY_BOOST | `elevenlabs_similarity_boost` | No. (Defaults to: `0.75`)   | `number` (0 - 1)           | How close the output should be to the original voice. |
| DISCORD_ELEVENLABS_STYLE           | `elevenlabs_style`           | No. (Defaults to: `0.3`)    | `number` (0 - 1)           | Style exaggeration. |
| DISCORD_ELEVENLABS_SPEAKER_BOOST   | `elevenlabs_speaker_boost`   | No. (Defaults to: `true`)   | `boolean`                  | Whether to use speaker boost. |
| DISCORD_ELEVENLABS_OUTPUT_FORMAT   | `elevenlabs_output_format`   | No. (Defaults to: `mp3_44100_128`) | `string`                   | The audio format requested to ElevenLabs. |
| DISCORD_ELEVENLABS_MAX_MESSAGE_LENGTH | `elevenlabs_max_message_length` | No. (Defaults to: `0`)      | `number`                   | Max characters per message for ElevenLabs only (it is charged per character). If `0`, `max_message_length` is used. |

> If you set `enable_tts_channels` to `true`, you must enable the message content privileged intent in your bot's [application page](https://discord.com/developers/applications/).

## Running on Docker

The `moonstarx/discord-tts-bot` image on Docker Hub is the original bot and does not include the changes of this fork, so build the image yourself:

```text
docker build -t discord-tts-bot .
```

Before you run this image, you should deploy your commands, you can do so by running:

```text
docker run -it --rm -e DISCORD_TOKEN="your_token" -e DISCORD_ENABLE_TTS_CHANNELS="true/false" discord-tts-bot npm run deploy
```

After that, you can start a container with the bot's image by running:

```text
docker run -it -e DISCORD_TOKEN="YOUR DISCORD TOKEN" discord-tts-bot
```

Check [configuration](#configuration) to see which environment variables you can use.

The following volumes can be used:

* `/opt/app/config`: The config folder for the bot, here you can use the `settings.json` file to configure the bot if you don't want to use environment variables.
* `/opt/app/data`: The data folder for the bot. If you use a `level` data provider you should set this volume to keep the bot's data persistent across restarts.

## Running on Repl.it

To run this bot on Repl.it, create a new Repl by importing this repository. Then, run the following commands:

```bash
chmod +x init-replit.sh
./init-replit.sh
```

This will set up the proper node environment for the bot.

Then, after you have [configured](#configuration) your bot, you should deploy your commands and start the bot with:

```text
npm run deploy
npm start
```

Make sure to have `enable_keep_alive` set to `true` and use UptimeRobot to poll the address that shows up for your repl to make sure it stays on 24/7.

## Deploying to Heroku

To deploy to Heroku, you can click on the image below and login to your account.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/xjuanfxx/discord-tts-bot)

You can now go back to your app's *Overview*, make sure you disable the *web* dyno and enable the *bot* dyno. Your bot should now be up and running. Remember you can always check your bot's console if you access the *View Logs* in the *More* dropdown menu.

## Usage

Here's a list of all the commands for the bot:

| Command                                   | Alias     | Description                                                                                         | Required Permissions |
|-------------------------------------------|-----------|-----------------------------------------------------------------------------------------------------|----------------------|
| /say \<message\>                          | /s        | Send a TTS message in your voice channel with your own settings or the ones saved for this server.  |                      |
| /stop                                     | /leave    | Stop the TTS bot and leave the channel.                                                             |                      |
| /skip                                     |           | Skip the message that is currently being said.                                                      |                      |
| /default_settings                         |           | Get the default TTS settings currently set for the guild.                                           |                      |
| /my_settings                              |           | Get the TTS settings you currently have set for yourself.                                           |                      |
| /set_default_provider \<provider\>        |           | Sets the provider to be used by the say command for the server by default.                          | `MANAGE_GUILD`       |
| /set_my_provider \<provider\>             |           | Sets the provider to be used by the say command for yourself.                                       |                      |
| /set_locale \<locale\>                    |           | Sets locale to be used by the bot in this guild.                                                    | `MANAGE_GUILD`       |
| /set_timeout \<timeout\>                  |           | Sets the timeout for the bot to leave the channel when not in use.                                  | `MANAGE_GUILD`       |
| /set_max_length \<length\>                |           | Sets the max characters per TTS message in this server (0 removes it). Cannot exceed the config limit. | `MANAGE_GUILD`       |
| /dictionary_add \<word\> \<replacement\>  |           | Make the bot read a word differently in this server (e.g. `xd` -> `equis de`).                      | `MANAGE_GUILD`       |
| /dictionary_remove \<word\>               |           | Remove a word from the dictionary of this server.                                                   | `MANAGE_GUILD`       |
| /dictionary_list                          |           | Show the words the bot reads differently in this server.                                            |                      |
| /google_langs                             |           | Display a list of the languages supported by the Google Translate provider.                         |                      |
| /google_say \<message\>                   |           | Send a Google Translate TTS message with multi-language support in your voice channel.              |                      |
| /google_set_default language \<language\> |           | Sets the language to be used by the say and google_say command by default.                          | `MANAGE_GUILD`       |
| /google_set_default speed \<speed\>       |           | Sets the speed to be used by the say and google_say command by default.                             | `MANAGE_GUILD`       |
| /google_set_my language \<language\>      |           | Sets the language to be used by the say and google_say command for yourself.                        |                      |
| /google_set_my speed \<speed\>            |           | Sets the speed to be used by the say and google_say command for yourself.                           |                      |
| /help                                     |           | Display a help message with all the available commands.                                             |                      |
| /aeiou_say \<message\>                    |           | Send an aeiou (sounds like Stephen Hawking) TTS message in your voice channel.                      |                      |
| /elevenlabs_say \<message\>               |           | Send an ElevenLabs AI TTS message in your voice channel (requires `elevenlabs_api_key`).            |                      |
| /elevenlabs_voices                        |           | Display a list of the voices available for the ElevenLabs provider.                                 |                      |
| /elevenlabs_set_my voice \<voice\>        |           | Sets the ElevenLabs voice (name or ID) to be used for yourself.                                     |                      |
| /elevenlabs_set_default voice \<voice\>   |           | Sets the ElevenLabs voice (name or ID) to be used by default in the server.                         | `MANAGE_GUILD`       |

If you have `enable_tts_channels` set to `true`, you will have access to the additional commands:

| Command                                   | Description                                                                      | Required Permissions |
|-------------------------------------------|----------------------------------------------------------------------------------|----------------------|
| /channel_settings                         | Get the TTS settings associated to this channel (if applies).                    |                      |
| /delete_channel_provider                  | Disable message-only based TTS on this channel (deletes its saved settings).     | `MANAGE_CHANNELS`    |
| /set_channel_provider \<provider\>        | Sets the provider to be used by the message-only based TTS on specific channels. | `MANAGE_CHANNELS`    |
| /google_set_channel language \<language\> | Sets the language to be used by the say and google_say command by default.       | `MANAGE_CHANNELS`    |
| /google_set_channel speed \<speed\>       | Sets the speed to be used by the say and google_say command by default.          | `MANAGE_CHANNELS`    | 
| /elevenlabs_set_channel voice \<voice\>   | Sets the ElevenLabs voice to be used by the message-only based TTS on this channel. | `MANAGE_CHANNELS`    |


## ElevenLabs

The ElevenLabs provider uses [ElevenLabs](https://elevenlabs.io) AI voices. It is a paid API (it is charged per character), so everything that costs money is controlled from the config and not by the servers.

1. Create an API key in your [ElevenLabs account](https://elevenlabs.io/app/settings/api-keys) and set it in `elevenlabs_api_key` (or `DISCORD_ELEVENLABS_API_KEY`). Without it, the ElevenLabs commands reply that the provider is not configured.
2. Pick a default voice with `elevenlabs_voice_id`. Once the bot is running you can use `/elevenlabs_voices` to see the voices of your account and their IDs.
3. Set `elevenlabs_language` to the language of your voices (e.g. `es`) so emojis are read in that language.
4. Optionally limit the cost with `elevenlabs_max_message_length`.

Users can then pick their own voice with `/elevenlabs_set_my voice <name or ID>`, admins can change the server's default with `/elevenlabs_set_default voice` and use ElevenLabs by default with `/set_default_provider`.

The model (`elevenlabs_model_id`) defaults to `eleven_v3`. `eleven_flash_v2_5` is faster and cheaper, which works great for a TTS bot.

## Text processing

Before a message is spoken, the bot:

1. Cuts it to the [character limit](#character-limits) (in TTS channels) or rejects it (in slash commands).
2. Replaces mentions with names, removes links and replaces emojis with their names (`enable_emoji_names`).
3. Applies the server's dictionary (`/dictionary_add`). Words are matched as whole words and ignoring case: with `xd` → `equis de`, *"XD"* is replaced but *"xdd"* isn't.
4. Adds the *"User said"* intro if `enable_who_said` is enabled.

### Character limits

| Limit                           | Set by                       | Applies to                     |
|---------------------------------|------------------------------|--------------------------------|
| `max_message_length`            | Bot owner (config)           | Every provider                 |
| `elevenlabs_max_message_length` | Bot owner (config)           | ElevenLabs (overrides the one above) |
| `/set_max_length`               | Server admins                | Every provider in that server  |

The effective limit is the lowest of them, so servers can only lower the limit set by the bot owner, never raise it. `0` means no limit.

## Language Support

Here's a list of all the supported languages by the Google Translate provider:

| Language Code | Language Name |
|---------------|---------------|
| af            | Afrikaans     |
| hy            | Armenian      |
| id            | Indonesian    |
| bn            | Bengali       |
| ca            | Catalan       |
| cs            | Czech         |
| da            | Danish        |
| de            | German        |
| en            | English       |
| es            | Spanish       |
| fil           | Filipino      |
| fr            | French        |
| hr            | Croatian      |
| is            | Icelandic     |
| it            | Italian       |
| jv            | Javanese      |
| km            | Khmer         |
| lv            | Latvian       |
| hu            | Hungarian     |
| ml            | Malayalam     |
| mr            | Marathi       |
| nl            | Dutch         |
| ne            | Nepali        |
| nb            | Norwegian     |
| pl            | Polish        |
| pt            | Portuguese    |
| ro            | Romanian      |
| si            | Sinhala       |
| sk            | Slovak        |
| su            | Sundanese     |
| sw            | Swahili       |
| fi            | Finnish       |
| sv            | Swedish       |
| ta            | Tamil         |
| te            | Telugu        |
| vi            | Vietnamese    |
| tr            | Turkish       |
| el            | Greek         |
| ru            | Russian       |
| sr            | Serbian       |
| uk            | Ukranian      |
| ar            | Arabic        |
| hi            | Hindi         |
| th            | Thai          |
| ko            | Korean        |
| cmn           | Chinese       |
| ja            | Japanese      |

## Author

This bot was made by [moonstar-x](https://github.com/moonstar-x). This fork is maintained by [xjuanfxx](https://github.com/xjuanfxx).
