import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    coverage: {
      provider: 'v8', // 指定使用 v8
      reporter: ['text', 'html'] // 可以是 'text', 'html', 'json', 'lcov' 等
    }
  },
  build: {
    rollupOptions: {
      input: {
        options: './options.html',
        monitor: './monitor.html',
        popup: './popup.html',
        background: './src/background/main.js'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})
