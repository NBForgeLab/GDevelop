const path = require('path');
const fs = require('fs');
const dir = path.resolve(__dirname, '../../src/UI/Theme/');

/**
 * @param {RegExp} pattern
 * @param {string} input
 * @returns {RegExpMatchArray[]}
 */
function matchAll(pattern, input) {
  const matches = input.match(new RegExp(pattern, 'g'));
  if (!matches) return [];

  return matches
    .map(index => index.match(new RegExp(pattern)))
    .filter(Boolean);
}

/**
 * @returns {Array<{ name: string, id: string }>}
 */
module.exports = () => {
  const tsRegistryPath = path.resolve(dir, './ThemeRegistry.ts');
  const registryPath = fs.existsSync(tsRegistryPath)
    ? tsRegistryPath
    : path.resolve(dir, './ThemeRegistry.js');
  const registryFileContents = fs.readFileSync(registryPath).toString();

  return matchAll(/\['(.*)']: (.*),/, registryFileContents)
    .map(it => {
      return ({
        name: it[1],
        id: it[2],
      });
    });
};
