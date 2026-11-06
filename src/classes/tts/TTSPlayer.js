const logger = require('@greencoast/logger');
const { createAudioResource } = require('@discordjs/voice');
const Queue = require('../Queue');
const VoiceManager = require('../VoiceManager');

class TTSPlayer {
  constructor(client, guild, disconnectScheduler) {
    this.client = client;
    this.guild = guild;
    this.disconnectScheduler = disconnectScheduler;
    this.providerManager = client.providerManager;

    this.queue = new Queue();
    this.speaking = false;
    this.currentMessageId = null;
    this.nextMessageId = 0;
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

  async say(sentence, providerName, extras = {}) {
    const provider = this.providerManager.getProvider(providerName);

    let payload;
    try {
      payload = await provider.createPayload(sentence, extras);
    } catch (error) {
      logger.error(`Failed to create TTS payload for provider ${providerName} in guild ${this.guild.name}: ${error.message}`);
      return;
    }

    // Some providers split a message into several payloads, tag them so /skip can skip the whole message.
    const messageId = this.nextMessageId++;
    const payloads = Array.isArray(payload) ? payload : [payload];
    payloads.forEach((p) => {
      p.messageId = messageId;
      this.queue.enqueue(p);
    });

    this.startDisconnectScheduler();

    if (!this.speaking) {
      this.play();
    }
  }

  async play() {
    if (this.queue.isEmpty()) {
      return;
    }

    const payload = this.queue.dequeue();
    this.currentMessageId = payload.messageId;
    const provider = this.providerManager.getProvider(payload.providerName);

    // Message contents are only logged in debug mode, normal logs shouldn't keep what users say.
    logger.info(`(${provider.constructor.NAME}): Playing a message (${payload.sentence.length} characters) in guild ${this.guild.name}.`);
    this.client.emit('debug', provider.getPlayLogMessage(payload, this.guild));

    this.speaking = true;
    this.voice.play(createAudioResource(payload.resource, {
      metadata: {
        title: payload.sentence
      }
    }));
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
    this.queue.removeWhere((payload) => payload.messageId === skippedId);

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

    this.queue.clear();
    this.speaking = false;
    this.currentMessageId = null;
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

module.exports = TTSPlayer;
