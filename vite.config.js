import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 3000,
  },
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        map:    resolve(__dirname, 'map.html'),
        detail: resolve(__dirname, 'event-detail.html'),
        plan:   resolve(__dirname, 'plan.html'),
      },
    },
  },
})
