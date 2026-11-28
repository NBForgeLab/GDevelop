/** @type {import('electron-builder').MacConfiguration} */
const baseMacConfig = {
  category: 'public.app-category.developer-tools',
  hardenedRuntime: true,
  // Electron does not run on older versions: this also prevents them from being auto-updated to it.
  minimumSystemVersion: '13.0',
  entitlements: './build/entitlements.mac.inherit.plist',
  target: {
    target: 'default',
    arch: ['universal'],
  },
  mergeASARs: false,
  x64ArchFiles:
    'Contents/Resources/app.asar.unpacked/node_modules/steamworks.js/dist/osx/steamworksjs.darwin-*.node',
};

/** @type {import('electron-builder').WindowsConfiguration} */
const baseWinConfig = {
  executableName: 'GDevelop',
  target: [
    { target: 'nsis', arch: ['x64'] },
    { target: 'zip', arch: ['x64'] },
  ],
};

/** @type {import('electron-builder').MacConfiguration} */
let macConfig = baseMacConfig;
/** @type {import('electron-builder').WindowsConfiguration} */
let winConfig = baseWinConfig;
/** @type {string | undefined} */
let afterSign = 'scripts/electron-builder-after-sign.js';

if (process.env.GD_PORTABLE_BUILD === 'true') {
  macConfig = {
    ...baseMacConfig,
    identity: null,
    hardenedRuntime: false,
  };
  afterSign = undefined;
  // Skip code signing while keeping resedit icon and version metadata edits active.
  winConfig = {
    ...baseWinConfig,
    signExecutable: false,
  };
  console.log(
    'ℹ️ GD_PORTABLE_BUILD is set — skipping macOS signing/notarization and Windows Authenticode signing.'
  );
} else if (
  process.env.GD_SIGNTOOL_SUBJECT_NAME &&
  process.env.GD_SIGNTOOL_THUMBPRINT
) {
  // electron-builder default signtool.exe is not sufficient for some reason.
  if (!process.env.SIGNTOOL_PATH) {
    console.error(
      "❌ SIGNTOOL_PATH is not specified - signing won't work with the builtin signtool provided by electron-builder."
    );
  } else {
    console.log(
      'ℹ️ SIGNTOOL_PATH is specified and set to:',
      process.env.SIGNTOOL_PATH
    );
  }

  // Seems required, see https://github.com/electron-userland/electron-builder/issues/6158#issuecomment-1587045539.
  /** @type {NonNullable<import('electron-builder').WindowsConfiguration['signtoolOptions']>} */
  const signtoolOptions = {
    certificateSubjectName: process.env.GD_SIGNTOOL_SUBJECT_NAME,
    certificateSha1: process.env.GD_SIGNTOOL_THUMBPRINT,
    signingHashAlgorithms: ['sha256'],
  };
  winConfig = {
    ...baseWinConfig,
    signtoolOptions,
  };
  console.log('ℹ️ Set Windows build signing options:', signtoolOptions);
} else {
  console.log('ℹ️ No Windows build signing options set.');
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'com.gdevelop-app.ide',
  directories: {
    app: 'app',
    buildResources: 'build',
    output: 'dist',
  },
  extraResources: [
    {
      from: '../app/resources/GDJS',
      to: 'GDJS',
    },
    {
      from: '../app/resources/preview_node_modules',
      to: 'preview_node_modules',
    },
  ],
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'deb',
        arch: ['x64', 'arm64'],
      },
    ],
  },
  mac: macConfig,
  win: winConfig,
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  appx: {
    publisherDisplayName: 'GDevelop game engine',
    displayName: 'GDevelop',
    publisher: 'CN=B13CB8D3-97AA-422C-A394-0EE51B9ACAD3',
    identityName: 'GDevelopgameengine.GDevelop',
    backgroundColor: '#524F9C',
    languages: [
      'EN-US',
      'ZH-HANS',
      'DE',
      'IT',
      'JA',
      'PT-BR',
      'RU',
      'ES',
      'FR',
      'SL',
    ],
  },
  afterSign,
  publish: [
    {
      provider: 'github',
    },
  ],
};

module.exports = config;
