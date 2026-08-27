import commonjs from 'vite-plugin-commonjs'
import eslint from 'vite-plugin-eslint'
import { federation } from '@module-federation/vite'
import path from 'node:path'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import { defineConfig, loadEnv } from 'vite'

import { loadMlrunProxyConfig } from './config/loadDevProxyConfig.js'
import { dependencies } from './package.json'

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd()), '')
  const mlrunProxyConfig = await loadMlrunProxyConfig(mode)

  // Always built so remoteEntry.js is present in every image - it's simply unused
  // when the app isn't loaded as a Module Federation remote (igz3/CE).
  const federationPlugin = federation({
    filename: 'remoteEntry.js',
    name: 'mlrun',
    // No TypeScript in this codebase, so the plugin's cross-remote .d.ts
    // sync (and its dev-only websocket) has nothing to do here.
    // TODO remove dts when migrate to TS
    dts: false,
    exposes: {
      './loadRemoteConfig': './src/loadRemoteConfig.js',
      './app': './src/main.jsx'
    },
    shared: {
      react: { requiredVersion: dependencies.react, singleton: true },
      'react-dom': { requiredVersion: dependencies['react-dom'], singleton: true }
    }
  })

  return {
    plugins: [commonjs(), react(), federationPlugin, svgr(), eslint({ failOnError: false })],
    // Relative so one build works both standalone (nginx strips /mlrun, see
    // nginx.conf.tmpl) and as an MF remote (module-federation runtime patches
    // chunk URLs from wherever remoteEntry.js actually loaded from - it needs
    // an unprefixed build to do that cleanly, same reason feature/ig4 cleared
    // VITE_PUBLIC_URL for MF builds instead of using the standalone /mlrun).
    base: env.NODE_ENV === 'production' ? './' : '/',
    server: {
      proxy: {
        ...mlrunProxyConfig(env)
      },
      fs: {
        strict: false
      },
      hmr: {
        protocol: 'ws'
      },
      port: 3000
    },
    resolve: {
      alias: {
        'igz-controls/nextGenComponents': path.resolve(
          __dirname,
          'node_modules/iguazio.dashboard-react-controls/dist/nextGenComponents/index.mjs'
        ),
        'igz-controls': path.resolve(
          __dirname,
          'node_modules/iguazio.dashboard-react-controls/dist'
        ),
        '@': path.resolve(__dirname, './src/nextGenComponents')
      },
      dedupe: [
        'react',
        'react-dom',
        'classnames',
        'final-form',
        'final-form-arrays',
        'lodash',
        'prop-types',
        'react-final-form',
        'react-final-form-arrays',
        'react-modal-promise',
        'react-transition-group'
      ]
    },
    optimizeDeps: {
      force: true
    },
    build: {
      target: 'esnext',
      sourcemap: true,
      outDir: 'build',
      chunkSizeWarningLimit: 3000
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          sourceMap: true,
          api: 'modern'
        }
      }
    }
  }
})
