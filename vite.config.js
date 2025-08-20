import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    // Use a renderer-specific folder to avoid clobbering electron-builder output dir
    outDir: 'renderer',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
}) 