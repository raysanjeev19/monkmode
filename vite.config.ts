import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Temporarily ship a self-destroying service worker so every visitor's
      // stale PWA cache (from the earlier no-login build) is wiped on next load.
      // Re-enable the full PWA by removing this flag once caches have cleared.
      selfDestroying: true,
      registerType: "autoUpdate",
      includeAssets: ["logo.png"],
      manifest: {
        name: "Monk Mode",
        short_name: "Monk Mode",
        description:
          "Personal productivity, fitness, study, and goal tracking — built for consistency and focus.",
        theme_color: "#FBF4E9",
        background_color: "#FBF4E9",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
});
