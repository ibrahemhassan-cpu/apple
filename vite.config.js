import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    /* installable on a phone like an app, and fully playable offline: every file of the build —
       all three games, the 3D code, the fonts and the icons — is saved on the device on the first visit */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        id: '/',
        name: 'البستان',
        short_name: 'البستان',
        description: 'ازرع، اسقي، اطلع السلم واقطف — بستان تفاعلي بيعلّم كل فاكهة بتتزرع إزاي.',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#5BB3E6',
        background_color: '#141944',
        categories: ['education', 'games', 'kids'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: { port: 5179 },
  build: { chunkSizeWarningLimit: 800 },   // three.js makes the game chunk big; it only loads when a game opens
});
