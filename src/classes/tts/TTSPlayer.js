const { Readable } = require('stream');
const axios = require('axios');
const logger = require('@greencoast/logger');
const { createAudioResource } = require('@discordjs/voice');
const Queue = require('../Queue');
const VoiceManager = require('../VoiceManager');

const PREFETCH_TIMEOUT = 10000;

/**
 * Plays the TTS messages of a guild.
 *
 * To keep the latency low:
 * - The audio of a message is requested to the provider as soon as possible (prepare()), even while the bot
 *   is still joining the voice channel, but messages are always played in the order they were sent.
 * - Audio given as a URL is downloaded as soon as the message is queued, not when it starts playing.
 * - While a part is playing, the next one is already being decoded so there's no gap between them.
 */
class TTSPlayer {
  constructor(client, guild, disconnectScheduler) {
    this.client = client;
    this.guild = guild;
    this.disconnectScheduler = disconnectScheduler;
    this.providerManager = client.providerManager;

    this.queue = new Queue();
    this.speaking = false;
    this.currentMessageId = null;
    this.skippedMessageId = null;
    this.nextMessageId = 0;
    // Incremented on every reset, anything prepared before a reset is thrown away.
    this.generation = 0;
    // Keeps the messages in order even if a later message is generated faster than an earlier one.
    this.enqueueChain = Promise.resolve();
    this.voice = new VoiceManager(guild, { onDestroy: () => this.reset() });

    this.initializePlayer();
    this.initializeScheduler();
  }

  initializePlayer() {
    // The player always goes to 'idle' after an 'error', so the next message is played from there.
    // Playing it here as well would skip a message.
    this.voice.player.on('error', (error) => {
      logger.error(`Audio player error in guild ${this.guild.name}: ${error.message}`);
    });

    this.voice.player.on('idle', () => {
      if (this.speaking) {
        this.speaking = false;
        this.play();
      }
    });
  }

  initializeScheduler() {
    this.disconnectScheduler.set(() => {
      const channel = this.stop();
      logger.info(`Left ${channel.name} from ${this.guild.name} due to inactivity.`);
    });
  }

  /**
   * Starts generating the audio of a message right away. Pass the result to enqueue() to play it
   * or to discard() if it won't be played.
   * @param {string} sentence
   * @param {string} providerName
   * @param {object} extras
   * @returns {{ messageId: number, generation: number, promise: Promise<Payload[]> }}
   */
  prepare(sentence, providerName, extras = {}) {
    const messageId = this.nextMessageId++;
    const provider = this.providerManager.getProvider(providerName);

    const promise = Promise.resolve()
      .then(() => provider.createPayload(sentence, extras))
      .then((payload) => {
        // Some providers split a message into several payloads, tag them so /skip can skip the whole message.
        const payloads = Array.isArray(payload) ? payload : [payload];
        payloads.forEach((p) => {
          p.messageId = messageId;
          this.prefetch(p);
        });
        return payloads;
      })
      .catch((error) => {
        logger.error(`Failed to create TTS payload for provider ${providerName} in guild ${this.guild.name}: ${error.message}`);
        return [];
      });

    return { messageId, generation: this.generation, promise };
  }

  /**
   * Queues a prepared message. Messages are queued in the order enqueue() is called.
   * @returns {Promise<void>} Resolves once the message is in the queue.
   */
  enqueue(prepared) {
    this.enqueueChain = this.enqueueChain.then(async () => {
      const payloads = await prepared.promise;

      if (prepared.generation !== this.generation) {
        TTSPlayer.discardPayloads(payloads);
        return;
      }

      if (payloads.length < 1) {
        return;
      }

      payloads.forEach((p) => this.queue.enqueue(p));
      this.startDisconnectScheduler();

      if (this.speaking) {
        this.preloadNext();
      } else {
        this.play();
      }
    });

    return this.enqueueChain;
  }

  /**
   * Throws away a prepared message that won't be played (e.g. the bot couldn't join the channel).
   */
  discard(prepared) {
    prepared.promise.then(TTSPlayer.discardPayloads);
  }

  say(sentence, providerName, extras = {}) {
    return this.enqueue(this.prepare(sentence, providerName, extras));
  }

  /**
   * Starts downloading the audio of a payload whose resource is a URL.
   */
  prefetch(payload) {
    if (typeof payload.resource !== 'string' || !/^https?:\/\//.test(payload.resource)) {
      return;
    }

    payload.prefetched = axios.get(payload.resource, { responseType: 'arraybuffer', timeout: PREFETCH_TIMEOUT })
      .then((response) => Buffer.from(response.data))
      .catch((error) => {
        // ffmpeg will try to get it from the URL by itself.
        this.client.emit('debug', `Could not prefetch TTS audio in guild ${this.guild.name}: ${error.message}`);
        return null;
      });
  }

  /**
   * Creates the audio resource of a payload (this starts decoding it). Created only once per payload.
   * @returns {Promise<AudioResource>}
   */
  getAudioResource(payload) {
    if (!payload.audioResource) {
      payload.audioResource = (async () => {
        const data = payload.prefetched ? await payload.prefetched : null;
        return createAudioResource(data ? Readable.from([data]) : payload.resource, {
          metadata: {
            title: payload.sentence
          }
        });
      })();
    }

    return payload.audioResource;
  }

  /**
   * Starts decoding the next payload in the queue so it's ready as soon as the current one ends.
   */
  preloadNext() {
    const next = this.queue.peek();
    if (next) {
      this.getAudioResource(next).catch(() => null);
    }
  }

  async play() {
    if (this.speaking || this.queue.isEmpty()) {
      return;
    }

    const payload = this.queue.dequeue();
    const { generation } = this;
    this.speaking = true;
    this.currentMessageId = payload.messageId;

    let resource;
    try {
      resource = await this.getAudioResource(payload);
    } catch (error) {
      logger.error(`Could not create the audio of a TTS message in guild ${this.guild.name}: ${error.message}`);
      resource = null;
    }

    // Reset or skipped while the audio was being loaded.
    if (generation !== this.generation || !resource || payload.messageId === this.skippedMessageId) {
      resource?.playStream.destroy();
      if (generation === this.generation) {
        this.speaking = false;
        this.play();
      }
      return;
    }

    const provider = this.providerManager.getProvider(payload.providerName);
    // Message contents are only logged in debug mode, normal logs shouldn't keep what users say.
    logger.info(`(${provider.constructor.NAME}): Playing a message (${payload.sentence.length} characters) in guild ${this.guild.name}.`);
    this.client.emit('debug', provider.getPlayLogMessage(payload, this.guild));

    this.voice.play(resource);
    this.preloadNext();
  }

  /**
   * Skips the message that is currently being said (including all of its remaining parts).
   * @returns {boolean} Whether something was skipped.
   */
  skip() {
    if (!this.speaking) {
      return false;
    }

    const skippedId = this.currentMessageId;
    this.skippedMessageId = skippedId;
    TTSPlayer.discardPayloads(this.queue.removeWhere((payload) => payload.messageId === skippedId));

    // Stopping the player emits 'idle', which plays the next message in the queue (if any).
    this.voice.player.stop(true);
    return true;
  }

  /**
   * Stops speaking and leaves the voice channel.
   * @returns {Discord.VoiceBasedChannel|{ name: string }} The channel that was left.
   */
  stop() {
    const channel = this.guild.members.me?.voice?.channel;

    this.voice.disconnect();
    this.reset();

    return channel || { name: 'null' };
  }

  /**
   * Clears the queue and the player state. Called whenever the voice connection is destroyed,
   * no matter the reason (stop, inactivity, kicked from the channel...).
   */
  reset() {
    this.stopDisconnectScheduler();

    this.generation++;
    TTSPlayer.discardPayloads(this.queue.removeWhere(() => true));
    this.speaking = false;
    this.currentMessageId = null;
    this.skippedMessageId = null;
    this.voice.player.stop(true);
  }

  startDisconnectScheduler() {
    if (!this.disconnectScheduler) {
      return;
    }

    if (this.disconnectScheduler.isAlive()) {
      this.disconnectScheduler.refresh();
    } else {
      this.disconnectScheduler.start(this);
    }
  }

  stopDisconnectScheduler() {
    if (!this.disconnectScheduler) {
      return;
    }

    if (this.disconnectScheduler.isAlive()) {
      this.disconnectScheduler.stop();
    }
  }
}

/**
 * Frees what payloads that won't be played are holding (open HTTP streams, ffmpeg processes).
 * @param {Payload[]} payloads
 */
TTSPlayer.discardPayloads = (payloads) => {
  payloads.forEach((payload) => {
    if (payload.resource && typeof payload.resource.destroy === 'function') {
      payload.resource.destroy();
    }

    if (payload.audioResource) {
      payload.audioResource.then((resource) => resource.playStream.destroy()).catch(() => null);
    }
  });
};

module.exports = TTSPlayer;
