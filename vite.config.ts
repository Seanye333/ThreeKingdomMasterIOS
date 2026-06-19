import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves from /<repo>/ — set only by the deploy workflow so
  // local dev, preview and the E2E webServer keep plain '/'.
  base: process.env.GHPAGES ? '/three-kingdom-masters/' : '/',
  plugins: [
    react(),
    // PWA — installable on phone home screens (fullscreen, offline-capable)
    // and as a desktop app window; the browser experience is unchanged.
    VitePWA({
      registerType: 'autoUpdate', // new deploys replace stale caches automatically
      includeAssets: ['favicon.svg', 'map-bg.jpg'],
      manifest: {
        name: '三國志大師 Three Kingdom Masters',
        short_name: '三國志大師',
        description: 'RTK-style grand strategy — one world from the realm map down to the battlefield.',
        theme_color: '#1a1410',
        background_color: '#0a0805',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The main bundle is ~5MB — well past workbox's 2MB default cap.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Portraits load lazily in bulk — cache them as they're seen instead
        // of precaching hundreds of images up front.
        runtimeCaching: [
          {
            urlPattern: /\/portraits\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tkm-portraits',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      // Never let the service worker interfere with dev.
      devOptions: { enabled: false },
    }),
  ],
})
