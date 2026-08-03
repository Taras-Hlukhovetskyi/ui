import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'

const drcDist = path.resolve(
  import.meta.dirname,
  './node_modules/iguazio.dashboard-react-controls/dist'
)

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        jsxRuntime: 'classic'
      },
      oxcOptions: {
        jsx: {
          runtime: 'classic'
        }
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'build', 'dist'],
    server: {
      deps: {
        inline: ['iguazio.dashboard-react-controls'],
        moduleDirectories: ['node_modules']
      }
    },
    alias: [
      {
        find: /^igz-controls\/images\/(.+)\.svg\?react$/,
        replacement: path.join(import.meta.dirname, 'src/__mocks__/svgMock.jsx')
      }
    ]
  },
  resolve: {
    alias: [
      {
        find: 'igz-controls/nextGenComponents',
        replacement: path.join(drcDist, 'nextGenComponents/index.mjs')
      },
      { find: 'igz-controls', replacement: drcDist },
      { find: '@', replacement: path.resolve(import.meta.dirname, './src/nextGenComponents') }
    ]
  }
})
