const fs = require('fs');
const path = require('path');
const logger = require('@greencoast/logger');

const CONFIG_PATH = path.join(__dirname, '../../config/settings.json');

/**
 * Gets the line and column of the character at the given index.
 */
const getLineAndColumn = (text, index) => {
  const before = text.slice(0, index);
  const lines = before.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
};

/**
 * Finds where a JSON text stops being valid, without relying on the parser error message
 * (which includes a piece of the file, e.g. a token or an API key).
 */
const findErrorIndex = (text) => {
  let low = 0;
  let high = text.length;

  // The longest prefix that can still be completed into valid JSON tells where the error is.
  // A prefix is "valid so far" if the parser fails only because the text ended.
  const isValidSoFar = (prefix) => {
    try {
      JSON.parse(prefix);
      return true;
    } catch (error) {
      return /end of JSON input|Unterminated string/i.test(error.message);
    }
  };

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (isValidSoFar(text.slice(0, middle))) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return low;
};

/**
 * Checks that config/settings.json (if it exists) is valid JSON before the config is loaded.
 * If it isn't, it logs where the error is WITHOUT printing the contents of the file (it contains
 * the bot token and API keys) and exits.
 */
const validateConfigFile = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    return;
  }

  const text = fs.readFileSync(CONFIG_PATH, 'utf8');
  try {
    JSON.parse(text);
  } catch (error) {
    const { line, column } = getLineAndColumn(text, findErrorIndex(text));
    logger.fatal(`config/settings.json is not valid JSON (around line ${line}, column ${column}). Check that every text value is wrapped in double quotes ("like this") and that there are commas between the settings but not after the last one.`);
    process.exit(1);
  }
};

const EMPTY_VALUES = ['', 'null', 'undefined'];

/**
 * Makes config.get() return null for text values that mean "nothing", like "" or "null" (it's easy to write
 * "testing_guild_id": "null" instead of null). Otherwise they'd be used as real values, e.g. a guild ID "null".
 * @param {ConfigProvider} config
 */
const treatEmptyValuesAsNull = (config) => {
  const get = config.get.bind(config);

  config.get = (key) => {
    const value = get(key);
    return typeof value === 'string' && EMPTY_VALUES.includes(value.trim().toLowerCase()) ? null : value;
  };
};

module.exports = {
  validateConfigFile,
  treatEmptyValuesAsNull
};
