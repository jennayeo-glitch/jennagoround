import { defineConfig } from 'vite'
import { resolve } from 'path'

/** /admin → admin.js 가 아닌 admin.html 로 열리도록 */
function htmlRouteRewrites() {
  const routes = {
    '/admin': '/admin.html',
    '/backoffice': '/backoffice.html',
    '/content': '/content-dashboard.html',
    '/content-dashboard': '/content-dashboard.html',
  }

  return {
    name: 'html-route-rewrites',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url || ''
        const [pathname, search = ''] = raw.split('?')
        const target = routes[pathname]
        if (target) {
          req.url = search ? `${target}?${search}` : target
        }
        next()
      })
    },
  }
}

export default defineConfig({
  server: {
    port: 3000,
  },
  base: './',
  plugins: [htmlRouteRewrites()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        map:    resolve(__dirname, 'map.html'),
        detail: resolve(__dirname, 'event-detail.html'),
        plan:   resolve(__dirname, 'plan.html'),
        admin:  resolve(__dirname, 'admin.html'),
        backoffice: resolve(__dirname, 'backoffice.html'),
        content: resolve(__dirname, 'content-dashboard.html'),
      },
    },
  },
})
