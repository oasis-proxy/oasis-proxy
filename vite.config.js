import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      input: {
        options: './options.html',
        popup: './popup.html',
        background: './src/background/main.js'
      },
      output: {
        // 指定输出文件名和路径
        entryFileNames: '[name].js', // 入口文件名作为输出文件名
        chunkFileNames: 'chunks/[name]-[hash].js', // 动态导入模块的输出文件名
        assetFileNames: 'assets/[name].[ext]' // 静态资源文件的输出文件名
      }
    }
  }
})
