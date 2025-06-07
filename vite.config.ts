import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Automatically adds SW registration code
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json,woff,woff2}'],
        // runtimeCaching is handled in our custom sw.js
        // No need to configure it here if using injectManifest with our own sw.js
      },
      devOptions: {
        enabled: true, // Enable PWA features in development for testing
        type: 'module', // Important for SW with ES6 imports
      },
      manifest: {
        name: 'Vigitel - Vistorias Técnicas',
        short_name: 'Vigitel',
        description: 'Aplicativo para realização de vistorias técnicas da Brasilit.',
        theme_color: '#1E40AF', // Brasilit Blue
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/', // Relative to the scope
        icons: [
          {
            src: 'pwa-192x192.png', // Path relative to public folder (Vite root/public)
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // Path relative to public folder
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512-maskable.png', // Path relative to public folder
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          }
        ]
      },
      // Use 'injectManifest' strategy to use our custom service worker (public/sw.js)
      // and inject the precache manifest into it.
      strategies: 'injectManifest',
      // srcDir should point to the directory where sw.js is located, relative to Vite root.
      // Vite root is 'client/', so 'public' means 'client/public/'
      srcDir: 'public',
      filename: 'sw.js'
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"), // Vite root is client/
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
