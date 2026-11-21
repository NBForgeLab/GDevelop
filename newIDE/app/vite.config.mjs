import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import {
  init as initCjsLexer,
  parse as parseCjsExports,
} from 'cjs-module-lexer';
import { transformSync as babelTransformSync } from '@babel/core';

let cjsLexerInitPromise = null;
const ensureCjsLexer = () => {
  if (!cjsLexerInitPromise) {
    cjsLexerInitPromise = initCjsLexer();
  }
  return cjsLexerInitPromise;
};

const require = createRequire(import.meta.url);
const presetFlow = require('@babel/preset-flow');
let sucraseTransform = null;
try {
  ({ transform: sucraseTransform } = require('sucrase'));
} catch (_) {}

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, '..', '..');
const publicDir = path.join(appDir, 'public');
const outDir = path.join(appDir, process.env.VITE_OUT_DIR || 'build');
const virtualHtmlId = path.join(appDir, 'index.html');
const gdjsForWebAppDir = path.join(
  appDir,
  'node_modules',
  'GDJS-for-web-app-only'
);

const WORKER_FACTORY_SUFFIXES = [
  path.join('src', 'Utils', 'BackgroundSerializerWorkerFactory.js'),
  path.join(
    'src',
    'ResourcesList',
    'ResourcePreview',
    'Resource3DPreviewWorkerFactory.js'
  ),
];
const CLASSIC_WORKER_PREFIX = '/@gdevelop-classic-worker/';
const VIRTUAL_CLASSIC_WORKER_FACTORY_PREFIX =
  '\0gdevelop-classic-worker-factory:';

const LOCALES_PATH_RE = /[\\/]src[\\/]locales[\\/]/;
const LOCALE_CHUNK_FACADE_RE = /[\\/]src[\\/]locales[\\/]([^\\/]+)[\\/]/;
const MONACO_CHUNK_RE = /[\\/]node_modules[\\/](?:react-)?monaco-editor[\\/]/;
const VENDOR_THREE_RE = /[\\/]node_modules[\\/]three[\\/]/;
const VENDOR_PIXI_RE = /[\\/]node_modules[\\/](?:pixi\.js|pixi\.js-legacy|@pixi|@esotericsoftware[\\/]spine-pixi-v7)[\\/]/;
const VENDOR_FIREBASE_RE = /[\\/]node_modules[\\/](?:firebase|@firebase)[\\/]/;
const SOURCE_CODE_RE = /[\\/]newIDE[\\/]app[\\/]src[\\/].*\.(js|jsx|ts|tsx)$/;
const REACT_VIRTUALIZED_ON_SCROLL_RE = /react-virtualized[\\/]dist[\\/]es[\\/]WindowScroller[\\/]utils[\\/]onScroll\.js$/;
const REACT_VIRTUALIZED_BAD_IMPORT =
  "import { bpfrpt_proptype_WindowScroller } from '../WindowScroller.js';";
const COMMONJS_SOURCE_PATTERNS = [
  LOCALES_PATH_RE,
  /[\\/]node_modules[\\/]GDJS-for-web-app-only[\\/]/,
  /[\\/]src[\\/]GameEngineFinder[\\/]LocalGDJSFinder\.js$/,
  /[\\/]src[\\/]JsExtensionsLoader[\\/](LocalJsExtensionsFinder|LocalJsExtensionsLoader|BrowserJsExtensionsLoader|index)\.js$/,
  /[\\/]src[\\/]Utils[\\/](MapFor|OptionalRequire)\.js$/,
  /[\\/]src[\\/]GameDashboard[\\/]PublicGameProperties\.js$/,
  /[\\/]src[\\/]EventsSheet[\\/]EventsTree[\\/]TextRenderer[\\/]EventScriptTestHelpers\.js$/,
];

const isExplicitCommonJsModule = id => {
  const cleanId = id.split('?')[0];
  return COMMONJS_SOURCE_PATTERNS.some(pattern => pattern.test(cleanId));
};

const normalizePublicUrl = (rawPublicUrl, command) => {
  if (rawPublicUrl !== undefined) {
    if (rawPublicUrl === '/') return '';
    return rawPublicUrl.endsWith('/')
      ? rawPublicUrl.slice(0, -1)
      : rawPublicUrl;
  }
  return command === 'build' ? '.' : '';
};

const computeViteBase = (publicUrl, command) => {
  if (command !== 'build') return '/';
  if (publicUrl === '.' || publicUrl === './') return './';
  if (!publicUrl) return '/';
  return publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;
};

const renderViteIndexHtml = ({ publicUrl }) => {
  const template = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const htmlWithPublicUrl = template.replace(/%PUBLIC_URL%/g, publicUrl);
  const globalShimScript =
    '<script>if(typeof globalThis.global==="undefined"){globalThis.global=globalThis;}if(typeof globalThis.process==="undefined"){globalThis.process={env:{},cwd:function(){return "/";}};}if(typeof globalThis.__dirname==="undefined"){globalThis.__dirname="/";}if(typeof globalThis.__filename==="undefined"){globalThis.__filename="/index.js";}</script>';
  const entryScript = '<script type="module" src="/src/index.js"></script>';

  return htmlWithPublicUrl
    .replace('</head>', `  ${globalShimScript}\n  </head>`)
    .replace('</body>', `  ${entryScript}\n  </body>`);
};

/**
 * Serves and builds HTML from `public/index.html` without duplicating it or letting
 * Vite's static public copy overwrite the built `index.html`.
 */
const createGdevelopHtmlPlugin = ({ publicUrl, command }) => ({
  name: 'gdevelop-html',
  enforce: 'pre',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const requestPath = (req.url || '/').split('?')[0];
      if (
        (req.method === 'GET' || req.method === 'HEAD') &&
        (requestPath === '/' || requestPath === '/index.html')
      ) {
        try {
          const rawHtml = renderViteIndexHtml({ publicUrl });
          const transformedHtml = await server.transformIndexHtml(
            req.url || '/',
            rawHtml
          );
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(req.method === 'HEAD' ? undefined : transformedHtml);
          return;
        } catch (err) {
          next(err);
          return;
        }
      }
      next();
    });
  },
  resolveId(source) {
    if (!source.includes('?') && path.resolve(source) === virtualHtmlId) {
      return virtualHtmlId;
    }
  },
  load(id) {
    if (!id.includes('?') && path.resolve(id) === virtualHtmlId) {
      return renderViteIndexHtml({ publicUrl });
    }
  },
  closeBundle() {
    if (command !== 'build') return;
    const publicIndexHtmlPath = path.join(publicDir, 'index.html');
    fs.cpSync(publicDir, outDir, {
      recursive: true,
      force: true,
      filter: src => path.resolve(src) !== publicIndexHtmlPath,
    });
  },
});

const createRawTextAssetsPlugin = () => ({
  name: 'gdevelop-raw-text-assets',
  enforce: 'pre',
  load(id) {
    const cleanId = id.split('?')[0];
    if (cleanId.endsWith('.md') || cleanId.endsWith('.d.ts')) {
      const content = fs.readFileSync(cleanId, 'utf8');
      return `export default ${JSON.stringify(content)};`;
    }
  },
});

/**
 * Rewrites `.worker` imports inside the decoupled WorkerFactory modules to Vite `?worker`
 * imports while leaving the factories untouched for Storybook/Webpack's `worker-loader`.
 * Classic workers that call `importScripts` are served as Flow-stripped classic scripts
 * in `vite` dev mode because dev `?worker` defaults to `{ type: 'module' }`.
 */
const createWorkerRedirectPlugin = ({ command }) => ({
  name: 'gdevelop-worker-redirect',
  enforce: 'pre',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const requestPath = (req.url || '').split('?')[0];
      if (!requestPath.startsWith(CLASSIC_WORKER_PREFIX)) {
        next();
        return;
      }

      const relWorkerPath = requestPath.slice(CLASSIC_WORKER_PREFIX.length);
      const absWorkerPath = path.resolve(appDir, relWorkerPath);
      if (!absWorkerPath.startsWith(path.resolve(appDir, 'src') + path.sep)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      try {
        const source = fs.readFileSync(absWorkerPath, 'utf8');
        const transformed = babelTransformSync(source, {
          filename: absWorkerPath,
          babelrc: false,
          configFile: false,
          presets: [presetFlow],
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.end((transformed && transformed.code) || source);
      } catch (err) {
        next(err);
      }
    });
  },
  resolveId(source, importer) {
    if (!importer || !source.endsWith('.worker')) return null;
    const cleanImporter = path.resolve(importer.split('?')[0]);
    const isWorkerFactory = WORKER_FACTORY_SUFFIXES.some(suffix =>
      cleanImporter.endsWith(suffix)
    );
    if (!isWorkerFactory) return null;

    const resolvedWorkerPath = path.resolve(
      path.dirname(cleanImporter),
      `${source}.js`
    );
    if (
      command === 'serve' &&
      resolvedWorkerPath.endsWith('BackgroundSerializer.worker.js')
    ) {
      const relPath = path
        .relative(appDir, resolvedWorkerPath)
        .split(path.sep)
        .join('/');
      return `${VIRTUAL_CLASSIC_WORKER_FACTORY_PREFIX}${relPath}`;
    }
    return `${resolvedWorkerPath}?worker`;
  },
  load(id) {
    if (!id.startsWith(VIRTUAL_CLASSIC_WORKER_FACTORY_PREFIX)) return null;
    const relPath = id.slice(VIRTUAL_CLASSIC_WORKER_FACTORY_PREFIX.length);
    return `export default function ClassicWorkerWrapper() { return new Worker(${JSON.stringify(
      `${CLASSIC_WORKER_PREFIX}${relPath}`
    )}); }`;
  },
});

const stripFlowForEsbuildScan = (source, filePath) => {
  if (sucraseTransform) {
    try {
      return sucraseTransform(source, {
        transforms: ['flow', 'jsx'],
        jsxRuntime: 'classic',
        disableESTransforms: true,
        filePath,
      }).code;
    } catch (_) {
      // Fall back to Babel for Flow constructs Sucrase does not accept (e.g. unnamed tuple params).
    }
  }
  const transformed = babelTransformSync(source, {
    filename: filePath,
    babelrc: false,
    configFile: false,
    presets: [presetFlow],
    parserOpts: {
      plugins: ['jsx'],
    },
  });
  return (transformed && transformed.code) || source;
};

const createFlowEsbuildScannerPlugin = () => ({
  name: 'flow-remove-types-scanner',
  setup(build) {
    build.onLoad({ filter: REACT_VIRTUALIZED_ON_SCROLL_RE }, args => {
      const source = fs.readFileSync(args.path, 'utf8');
      return {
        contents: source.replace(REACT_VIRTUALIZED_BAD_IMPORT, ''),
        loader: 'js',
      };
    });
    build.onLoad({ filter: SOURCE_CODE_RE }, args => {
      if (LOCALES_PATH_RE.test(args.path)) {
        return { contents: '', loader: 'js' };
      }
      const isTypeScript = args.path.endsWith('.ts') || args.path.endsWith('.tsx');
      if (isTypeScript) {
        return {
          contents: fs.readFileSync(args.path, 'utf8'),
          loader: args.path.endsWith('.tsx') ? 'tsx' : 'ts',
        };
      }
      const source = fs.readFileSync(args.path, 'utf8');
      return {
        contents: stripFlowForEsbuildScan(source, args.path),
        loader: 'jsx',
      };
    });
  },
});

const createReactVirtualizedFixPlugin = () => ({
  name: 'gdevelop-react-virtualized-fix',
  transform(code, id) {
    if (REACT_VIRTUALIZED_ON_SCROLL_RE.test(id.split('?')[0])) {
      return code.replace(REACT_VIRTUALIZED_BAD_IMPORT, '');
    }
  },
});

/**
 * Strips Flow types and compiles classic JSX with Sucrase on non-macro `.js` source
 * files before `@vitejs/plugin-react` runs, letting Babel skip files that do not need
 * `@lingui/macro` or Fast Refresh instrumentation.
 */
const createFastFlowJsxPlugin = ({ macroFileIds, sucraseHandledIds }) => ({
  name: 'gdevelop-fast-flow-jsx',
  enforce: 'pre',
  transform(code, id) {
    const cleanId = id.split('?')[0];
    sucraseHandledIds.delete(cleanId);
    macroFileIds.delete(cleanId);
    if (
      !cleanId ||
      cleanId.startsWith('\0') ||
      cleanId.includes('node_modules') ||
      LOCALES_PATH_RE.test(cleanId) ||
      !SOURCE_CODE_RE.test(cleanId)
    ) {
      return null;
    }

    if (code.includes('@lingui/macro')) {
      macroFileIds.add(cleanId);
      return null;
    }

    if (!sucraseTransform) {
      return null;
    }

    try {
      const isTypeScript = cleanId.endsWith('.ts') || cleanId.endsWith('.tsx');
      const transformed = sucraseTransform(code, {
        transforms: isTypeScript ? ['typescript', 'jsx'] : ['flow', 'jsx'],
        jsxRuntime: 'classic',
        disableESTransforms: true,
        filePath: cleanId,
        sourceMapOptions: {
          compiledFilename: cleanId,
        },
      });
      sucraseHandledIds.add(cleanId);
      return {
        code: transformed.code,
        map: transformed.sourceMap
          ? { ...transformed.sourceMap, sourcesContent: [code] }
          : null,
      };
    } catch (_) {
      // Fall back to Babel for Flow syntax Sucrase does not support (e.g. unnamed tuple types).
      return null;
    }
  },
});

const createBabelReactPlugins = ({ macroFileIds, sucraseHandledIds }) =>
  react({
    include: /\.[tj]sx?$/,
    exclude: [/node_modules/, LOCALES_PATH_RE],
    jsxRuntime: 'classic',
    babel: id => {
      const cleanId = id.split('?')[0];
      if (sucraseHandledIds.has(cleanId)) {
        return {
          babelrc: false,
          configFile: false,
          presets: [],
          plugins: [],
        };
      }
      const isTypeScript = cleanId.endsWith('.ts') || cleanId.endsWith('.tsx');
      return {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-react', { runtime: 'classic' }],
          isTypeScript ? '@babel/preset-typescript' : '@babel/preset-flow',
        ],
        plugins: macroFileIds.has(cleanId) ? ['babel-plugin-macros'] : [],
      };
    },
  });

const createTransformPipelinePlugins = () => {
  const macroFileIds = new Set();
  const sucraseHandledIds = new Set();
  return [
    createFastFlowJsxPlugin({ macroFileIds, sucraseHandledIds }),
    createBabelReactPlugins({ macroFileIds, sucraseHandledIds }),
  ];
};

const VALID_ESM_IDENTIFIER_RE = /^[A-Za-z_$][\w$]*$/;

const appendNamedCommonJsExports = (transformedResult, sourceCode) => {
  if (
    !transformedResult ||
    typeof transformedResult.code !== 'string' ||
    !transformedResult.code.includes(
      '/* [vite-plugin-commonjs] export-statement-S */'
    )
  ) {
    return transformedResult;
  }

  let parsed;
  try {
    parsed = parseCjsExports(sourceCode);
  } catch (_) {
    return transformedResult;
  }

  const exportBlockStart = transformedResult.code.lastIndexOf(
    '/* [vite-plugin-commonjs] export-statement-S */'
  );
  const existingExportText = transformedResult.code.slice(exportBlockStart);
  const existingNames = new Set(
    [...existingExportText.matchAll(/\bas\s+([A-Za-z_$][\w$]*)/g)].map(
      match => match[1]
    )
  );

  const extraLines = [];
  for (const exportName of parsed.exports) {
    if (
      exportName === 'default' ||
      exportName === '__esModule' ||
      !VALID_ESM_IDENTIFIER_RE.test(exportName) ||
      existingNames.has(exportName)
    ) {
      continue;
    }
    existingNames.add(exportName);
    extraLines.push(
      `const __CJS__named_${exportName}__ = (module.exports == null ? {} : module.exports)[${JSON.stringify(
        exportName
      )}];\nexport { __CJS__named_${exportName}__ as ${exportName} };`
    );
  }

  if (!extraLines.length) {
    return transformedResult;
  }

  return {
    ...transformedResult,
    code: `${transformedResult.code}\n${extraLines.join('\n')}\n`,
  };
};

const createCommonJsPlugin = () => {
  const basePlugin = commonjs({
    filter(id) {
      return isExplicitCommonJsModule(id);
    },
  });
  const baseTransform = basePlugin.transform;

  return {
    ...basePlugin,
    apply: 'serve',
    async transform(code, id, options) {
      await ensureCjsLexer();
      const result = await baseTransform.call(this, code, id, options);
      if (!isExplicitCommonJsModule(id)) {
        return result;
      }
      return appendNamedCommonJsExports(result, code);
    },
  };
};

const getVendorManualChunk = id => {
  if (id === '\0commonjsHelpers.js') return 'vendor-commonjs-helpers';
  if (id.startsWith('\0')) return undefined;
  const cleanId = id.split('?')[0];
  if (VENDOR_THREE_RE.test(cleanId)) return 'vendor-three';
  if (VENDOR_PIXI_RE.test(cleanId)) return 'vendor-pixi';
  if (VENDOR_FIREBASE_RE.test(cleanId)) return 'vendor-firebase';
  return undefined;
};

const getChunkFileName = chunkInfo => {
  const facadeId = chunkInfo.facadeModuleId
    ? chunkInfo.facadeModuleId.split('?')[0]
    : '';
  const cleanModuleIds = chunkInfo.moduleIds.map(id =>
    id.replace(/^\0/, '').split('?')[0]
  );

  const localeModuleId =
    facadeId && LOCALE_CHUNK_FACADE_RE.test(facadeId)
      ? facadeId
      : cleanModuleIds.find(id => LOCALE_CHUNK_FACADE_RE.test(id));
  if (localeModuleId) {
    const localeMatch = localeModuleId.match(LOCALE_CHUNK_FACADE_RE);
    if (localeMatch) {
      return `assets/locales-${localeMatch[1]}-[name]-[hash].js`;
    }
  }

  if (
    (facadeId && MONACO_CHUNK_RE.test(facadeId)) ||
    (!facadeId &&
      cleanModuleIds.length > 0 &&
      cleanModuleIds.some(id => MONACO_CHUNK_RE.test(id)) &&
      cleanModuleIds.every(
        id => MONACO_CHUNK_RE.test(id) || id.includes('commonjsHelpers')
      ))
  ) {
    return 'assets/monaco-[name]-[hash].js';
  }

  if (!facadeId) {
    if (chunkInfo.name && chunkInfo.name.startsWith('vendor-')) {
      return 'assets/[name]-[hash].js';
    }
    return 'assets/shared-[hash].js';
  }

  return 'assets/[name]-[hash].js';
};

export default defineConfig(({ command, mode }) => {
  const publicUrl = normalizePublicUrl(process.env.PUBLIC_URL, command);
  const viteBase = computeViteBase(publicUrl, command);
  const reactAppEnv =
    process.env.REACT_APP_ENV ||
    (command === 'serve' || mode === 'development'
      ? 'development'
      : 'production');
  const nodeEnv =
    process.env.NODE_ENV ||
    (command === 'build' ? 'production' : 'development');

  return {
    root: appDir,
    cacheDir: path.join(appDir, 'node_modules', '.cache', 'vite'),
    base: viteBase,
    // Lower resource management syntax even in dev for older editor browsers.
    esbuild: { supported: { using: false } },
    publicDir: command === 'serve' ? publicDir : false,
    css: {
      postcss: {
        plugins: [],
      },
    },
    server: {
      port: 3000,
      preTransformRequests: true,
      warmup: {
        clientFiles: [
          './src/index.js',
          './src/BrowserApp.js',
          './src/MainFrame/index.js',
        ],
      },
      watch: {
        ignored: [
          '**/build/**',
          '**/build-storybook/**',
          '**/coverage/**',
        ],
      },
      fs: {
        allow: [repoRoot],
      },
    },
    define: {
      'process.env.PUBLIC_URL': JSON.stringify(publicUrl),
      'process.env.REACT_APP_ENV': JSON.stringify(reactAppEnv),
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      alias: {
        'GDJS-for-web-app-only': gdjsForWebAppDir,
      },
    },
    plugins: [
      createGdevelopHtmlPlugin({ publicUrl, command }),
      createRawTextAssetsPlugin(),
      createWorkerRedirectPlugin({ command }),
      createReactVirtualizedFixPlugin(),
      ...createTransformPipelinePlugins(),
      createCommonJsPlugin(),
    ],
    worker: {
      format: 'iife',
      plugins: () => [
        createRawTextAssetsPlugin(),
        ...createTransformPipelinePlugins(),
        createCommonJsPlugin(),
      ],
    },
    optimizeDeps: {
      entries: ['src/index.js', 'src/BrowserApp.js', 'src/LocalApp.js'],
      esbuildOptions: {
        loader: { '.js': 'jsx' },
        plugins: [createFlowEsbuildScannerPlugin()],
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: process.env.GENERATE_SOURCEMAP === 'true',
      commonjsOptions: {
        include: [/node_modules/, ...COMMONJS_SOURCE_PATTERNS],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        input: virtualHtmlId,
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: getChunkFileName,
          manualChunks: getVendorManualChunk,
        },
      },
    },
  };
});
