// Only the operations used by the Steamworks extension cross this boundary.
const syncMethods = new Set([
  'achievement.activate',
  'achievement.clear',
  'achievement.isActivated',
  'localplayer.getSteamId',
  'localplayer.getName',
  'localplayer.getIpCountry',
  'localplayer.getLevel',
  'localplayer.setRichPresence',
  'utils.getAppId',
  'utils.getServerRealTime',
  'utils.isSteamRunningOnSteamDeck',
  'apps.isSubscribedApp',
  'apps.isAppInstalled',
  'apps.isDlcInstalled',
  'apps.appInstallDir',
  'apps.isVacBanned',
  'apps.isLowViolence',
  'apps.isSubscribed',
  'apps.currentGameLanguage',
  'apps.currentBetaName',
  'apps.appBuildId',
  'cloud.isEnabledForAccount',
  'cloud.isEnabledForApp',
  'cloud.readFile',
  'cloud.writeFile',
  'cloud.fileExists',
  'cloud.deleteFile',
  'workshop.download',
  'workshop.state',
  'workshop.installInfo',
  'workshop.downloadInfo',
  'lobby.leave',
  'lobby.openInviteDialog',
  'lobby.getData',
  'lobby.setData',
  'lobby.setJoinable',
  'lobby.getMemberCount',
  'lobby.getMemberLimit',
  'lobby.getOwner',
  'lobby.getMembers',
]);
const asyncMethods = new Set([
  'matchmaking.createLobby',
  'matchmaking.getLobbies',
  'matchmaking.joinLobby',
  'workshop.createItem',
  'workshop.updateItem',
  'workshop.subscribe',
  'workshop.unsubscribe',
]);

const createPreviewSteamSession = ({
  loadSteam = () => require('steamworks.js'),
  assertReadPath,
}) => {
  let client = null;
  let initializedAppId = null;
  const lobbies = new Map();
  const validate = (method, args, allowed) => {
    if (!allowed.has(method))
      throw new Error('Steam operation is not allowed.');
    if (!client) throw new Error('Steam is not initialized.');
    if (!Array.isArray(args) || args.length > 8)
      throw new Error('Invalid Steam arguments.');
    for (const value of args) {
      if (typeof value === 'string' && value.length > 10 * 1024 * 1024)
        throw new Error('Steam argument is too large.');
    }
    if (/^cloud\.(readFile|writeFile|fileExists|deleteFile)$/.test(method)) {
      const filename = args[0];
      if (
        typeof filename !== 'string' ||
        !filename ||
        filename.includes('\0') ||
        /^[\\/]|^[a-z]:/i.test(filename) ||
        filename.split(/[\\/]/).includes('..')
      ) {
        throw new Error('Invalid Steam cloud filename.');
      }
    }
  };
  const rememberLobby = lobby => {
    const id = lobby.id.toString();
    lobbies.set(id, lobby);
    return id;
  };
  return {
    initialize(appId) {
      if (!Number.isInteger(appId) || appId <= 0 || appId > 0xffffffff)
        throw new Error('Invalid Steam AppID.');
      if (client) {
        if (initializedAppId !== appId)
          throw new Error('Steam AppID cannot change during a preview.');
        return;
      }
      const steam = loadSteam();
      steam.electronEnableSteamOverlay();
      client = steam.init(appId);
      initializedAppId = appId;
    },
    call(method, args) {
      validate(method, args, syncMethods);
      const [group, operation] = method.split('.');
      if (group === 'lobby') {
        const lobby = lobbies.get(String(args[0]));
        if (!lobby) throw new Error('Unknown lobby.');
        const result = lobby[operation](...args.slice(1));
        if (operation === 'leave') lobbies.delete(String(args[0]));
        return result;
      }
      return client[group][operation](...args);
    },
    async invoke(method, args) {
      validate(method, args, asyncMethods);
      if (method === 'workshop.updateItem') {
        const changes = args[1];
        if (!changes || typeof changes !== 'object' || Array.isArray(changes))
          throw new Error('Invalid workshop changes.');
        const allowedKeys = new Set([
          'title',
          'description',
          'changeNote',
          'previewPath',
          'contentPath',
          'tags',
          'visibility',
        ]);
        if (Object.keys(changes).some(key => !allowedKeys.has(key)))
          throw new Error('Invalid workshop field.');
        if (changes.previewPath) assertReadPath(changes.previewPath);
        if (changes.contentPath) assertReadPath(changes.contentPath);
      }
      const [group, operation] = method.split('.');
      const result = await client[group][operation](...args);
      if (method === 'matchmaking.getLobbies') return result.map(rememberLobby);
      if (
        method === 'matchmaking.createLobby' ||
        method === 'matchmaking.joinLobby'
      )
        return rememberLobby(result);
      return result;
    },
    dispose() {
      for (const lobby of lobbies.values()) {
        try {
          lobby.leave();
        } catch (_) {}
      }
      lobbies.clear();
      client = null;
    },
  };
};

module.exports = { createPreviewSteamSession };
