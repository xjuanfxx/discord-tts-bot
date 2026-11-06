const fs = require('fs');
const path = require('path');

/*
 * Turns emojis into their spoken name using the CLDR annotations shipped by emojibase-data,
 * e.g. 😎 -> "cara sonriendo con gafas de sol" (es) / "smiling face with sunglasses" (en).
 */

const DATA_DIR = path.dirname(require.resolve('emojibase-data/package.json'));
const FALLBACK_LANGUAGE = 'en';

const SUPPORTED_LANGUAGES = fs.readdirSync(DATA_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DATA_DIR, entry.name, 'compact.json')))
  .map((entry) => entry.name);

// Characters that make a grapheme an emoji we should try to name.
const EMOJI_GRAPHEME_PATTERN = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;
const VARIATION_SELECTOR_PATTERN = /️/g;
const SKIN_TONE_PATTERN = /[\u{1F3FB}-\u{1F3FF}]/gu;
const CUSTOM_EMOJI_PATTERN = /<a?:(\w+?):\d{17,20}>/g;

const nameMaps = new Map();
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

const normalize = (emoji) => emoji.replace(VARIATION_SELECTOR_PATTERN, '');

const loadNameMap = (language) => {
  if (nameMaps.has(language)) {
    return nameMaps.get(language);
  }

  // eslint-disable-next-line global-require
  const data = require(`emojibase-data/${language}/compact.json`);
  const map = new Map();

  const add = ({ unicode, label }) => {
    if (unicode && label) {
      map.set(normalize(unicode), label);
    }
  };

  data.forEach((emoji) => {
    add(emoji);
    emoji.skins?.forEach(add);
  });

  nameMaps.set(language, map);
  return map;
};

/**
 * Resolves a TTS language code (e.g. "es", "es-MX", "en-gb", "zh-TW") to an emojibase locale.
 * @param {string} language
 * @returns {string}
 */
const resolveEmojiLanguage = (language) => {
  if (!language || typeof language !== 'string') {
    return FALLBACK_LANGUAGE;
  }

  const code = language.toLowerCase().replace('_', '-');
  const [base] = code.split('-');
  const candidates = [code, base];

  if (base === 'zh' && /-(tw|hk|mo|hant)/.test(code)) {
    candidates.unshift('zh-hant');
  }

  return candidates.find((candidate) => SUPPORTED_LANGUAGES.includes(candidate)) || FALLBACK_LANGUAGE;
};

/**
 * Gets the spoken name of a single emoji grapheme, or null if unknown.
 * @param {string} emoji
 * @param {string} language An emojibase locale.
 * @returns {string|null}
 */
const getEmojiName = (emoji, language = FALLBACK_LANGUAGE) => {
  const map = loadNameMap(language);
  const normalized = normalize(emoji);

  // Prefer the name without the skin tone ("thumbs up" instead of "thumbs up: medium skin tone"),
  // it's shorter and sounds more natural when spoken.
  return map.get(normalized.replace(SKIN_TONE_PATTERN, '')) || map.get(normalized) || null;
};

const customEmojiToWords = (name) => {
  return name
    .replace(/_+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
};

/**
 * Replaces every emoji (unicode and Discord custom) in a message with its name.
 * Consecutive repeated emojis are only read once so "😂😂😂😂" doesn't get read four times.
 * @param {string} message
 * @param {string} language A TTS language code.
 * @returns {string}
 */
const replaceEmojisWithNames = (message, language) => {
  const emojiLanguage = resolveEmojiLanguage(language);
  const withCustom = message.replace(CUSTOM_EMOJI_PATTERN, (_, name) => ` ${customEmojiToWords(name)} `);

  const parts = [];
  let lastEmojiName = null;

  for (const { segment } of segmenter.segment(withCustom)) {
    if (!EMOJI_GRAPHEME_PATTERN.test(segment)) {
      if (lastEmojiName && segment.trim().length > 0) {
        lastEmojiName = null;
      }

      parts.push(segment);
      continue;
    }

    const name = getEmojiName(segment, emojiLanguage);
    if (name && name !== lastEmojiName) {
      parts.push(` ${name} `);
    }

    lastEmojiName = name;
  }

  return parts.join('').replace(/[^\S\n]{2,}/g, ' ').trim();
};

module.exports = {
  replaceEmojisWithNames,
  resolveEmojiLanguage,
  getEmojiName
};
