import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
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
