// Jest transform for the text files imported as strings (see the matching
// raw text plugin in vite.config.mjs).
module.exports = {
  process(sourceText) {
    return { code: `module.exports = ${JSON.stringify(sourceText)};` };
  },
};
