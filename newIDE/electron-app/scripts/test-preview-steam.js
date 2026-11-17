const assert = require('assert');
const { createPreviewSteamSession } = require('../app/PreviewSteam');
const native = {
  electronEnableSteamOverlay() {},
  init: () => ({
    localplayer: { getName: () => 'Player' },
    matchmaking: {
      createLobby: async () => ({ id: 42n, getMemberCount: () => 3 }),
    },
    workshop: { updateItem: async () => true },
  }),
};
(async () => {
  const steam = createPreviewSteamSession({
    loadSteam: () => native,
    assertReadPath: () => {
      throw new Error('not authorized');
    },
  });
  assert.throws(() => steam.initialize(-1), /AppID/);
  steam.initialize(480);
  assert.strictEqual(steam.call('localplayer.getName', []), 'Player');
  assert.throws(() => steam.call('constructor.constructor', []), /not allowed/);
  assert.throws(() => steam.call('cloud.readFile', ['../secret']), /filename/);
  assert.strictEqual(
    await steam.invoke('matchmaking.createLobby', [2, 4]),
    '42'
  );
  assert.strictEqual(steam.call('lobby.getMemberCount', ['42']), 3);
  assert.throws(
    () => steam.call('lobby.getMemberCount', ['99']),
    /Unknown lobby/
  );
  await assert.rejects(
    () =>
      steam.invoke('workshop.updateItem', [1n, { contentPath: '/private' }]),
    /not authorized/
  );
  steam.dispose();
  assert.throws(() => steam.call('localplayer.getName', []), /not initialized/);
  console.log('Preview Steam assertions passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
