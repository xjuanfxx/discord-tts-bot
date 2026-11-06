/**
 * Summarizes a Discord API error in one line. The error objects of discord.js include the whole request
 * (e.g. every command when deploying them), logging them as they are floods the console.
 * @param {Error} error
 * @returns {string}
 */
const describeDiscordError = (error) => {
  const status = error.status ? `HTTP ${error.status} - ` : '';
  const code = error.code ? ` (code ${error.code})` : '';
  const details = error.rawError?.errors ? ` Details: ${JSON.stringify(error.rawError.errors).slice(0, 1000)}` : '';

  return `${status}${error.message}${code}.${details}`;
};

module.exports = {
  describeDiscordError
};
