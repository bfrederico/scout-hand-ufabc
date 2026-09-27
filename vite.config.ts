import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// SCOUT-HAND-UFABC — build config
// PWA: manifest + service worker + cache offline (seção 6, 43, 47 do spec)
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "SCOUT-HAND-UFABC",
        short_name: "ScoutHand",
        description: "Sistema de scout e análise de partidas de handebol",
        theme_color: "#0F8A3C",
        background_color: "#0B3D20",
        display: "standalone",
        orientation: "landscape",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // cache dos recursos essenciais para funcionar offline após primeira carga
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // nunca cachear chamadas de API/Supabase — dados ficam no IndexedDB
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/api") ||
              url.hostname.includes("supabase.co"),
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 5173,
  },
});
