import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Stratégie generateSW : Workbox génère automatiquement un service worker
      // qui met en cache tous les assets statiques (JS, CSS, GeoJSON, fonts).
      strategies: 'generateSW',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Départements & Régions de France',
        short_name: 'FrDépartements',
        description: 'Explorez et apprenez les 101 départements et 18 régions de France',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/carte',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Met en cache tous les GeoJSON et assets JS/CSS
        globPatterns: ['**/*.{js,css,html,svg,ico,json}'],
        // Limite la taille max d'un fichier mis en cache à 10 MB (GeoJSON volumineux)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache-first pour les GeoJSON : données stables entre les builds
            urlPattern: /\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geojson-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // Exclut les tests Playwright (gérés par leur propre runner)
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
