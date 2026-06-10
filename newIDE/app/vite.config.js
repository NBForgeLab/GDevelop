import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { transformSync } from '@babel/core';
import path from 'path';

const flowPlugin = () => ({
  name: 'flow-strip-types',
  enforce: 'pre',
  configResolved(config) {
    if (config.oxc && typeof config.oxc === 'object') {
      config.oxc.jsxRefreshInclude = undefined;
      config.oxc.jsxRefreshExclude = undefined;
      config.oxc.exclude = [/\.js$/];
    }
  },
  transform(code, id) {
    const normalizedId = id.replace(/\\/g, '/');
    if (normalizedId.includes('/src/') && /\.jsx?(?:\?|$)/.test(normalizedId)) {
      const filePath = id.split('?')[0];
      const result = transformSync(code, {
        babelrc: false,
        configFile: false,
        filename: filePath,
        presets: ['@babel/preset-flow', '@babel/preset-react'],
        plugins: ['babel-plugin-macros'],
        sourceMaps: false,
        compact: true,
        ast: false,
      });
      return {
        code: result.code,
        map: null,
      };
    }
    return null;
  },
});

const workerPlugin = () => ({
  name: 'worker-loader-polyfill',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source.endsWith('.worker') || source.endsWith('.worker.js')) {
      if (!source.includes('?worker')) {
        const resolved = await this.resolve(source, importer, {
          skipSelf: true,
        });
        if (resolved) {
          return resolved.id + '?worker';
        }
      }
    }
    return null;
  },
});

const reactVirtualizedPatchPlugin = () => ({
  name: 'react-virtualized-patch',
  transform(code, id) {
    if (id.includes('react-virtualized')) {
      const cleanCode = code
        .replace(
          /import\s+\{\s*bpfrpt_proptype_[^}]*\}\s+from\s+['"][^'"]+['"];?/g,
          ''
        )
        .replace(/export\s+\{\s*bpfrpt_proptype_[^}]*\};?/g, '');
      return {
        code: cleanCode,
        map: null,
      };
    }
    return null;
  },
});

export default defineConfig({
  oxc: false,
  plugins: [
    workerPlugin(),
    reactVirtualizedPatchPlugin(),
    flowPlugin(),
    react(),
  ],
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      ...Object.keys(process.env)
        .filter(key => key.startsWith('REACT_APP_'))
        .reduce((env, key) => {
          env[key] = JSON.stringify(process.env[key]);
          return env;
        }, {}),
    },
    'process.platform': JSON.stringify(process.platform || 'browser'),
  },
  resolve: {
    alias: {
      'GDJS-for-web-app-only': path.resolve(
        import.meta.dirname,
        'resources/GDJS'
      ),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    emptyOutDir: true,
    cssMinify: 'esbuild',
    rolldownOptions: {
      external: ['react-dnd-html5-backend'],
    },
  },
  worker: {
    plugins: () => [flowPlugin()],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    watch: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
    },
  },
});
