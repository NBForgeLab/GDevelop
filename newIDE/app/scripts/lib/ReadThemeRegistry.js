const path = require('path');
const fs = require('fs');
const dir = path.resolve(__dirname, '../../src/UI/Theme/');

function matchAll(pattern, input) {
  return input
    .match(new RegExp(pattern, 'g'))
    .map(index => index.match(new RegExp(pattern)));
}

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
