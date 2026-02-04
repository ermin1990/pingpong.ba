import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'TeamSphere - PingPong BIH',
        short_name: 'TeamSphere',
        description: 'Tournament management system',
        theme_color: '#070b14',
        background_color: '#070b14',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Exclude Firebase and other APIs from being handled by Workbox
        navigateFallbackDenylist: [/^\/__/, /^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
  base: '/', // Hosting root path (change to '/subpath/' if deploying to subdirectory)
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production for smaller bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})
