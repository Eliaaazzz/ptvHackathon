import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Inspector Ops",
        short_name: "InspectorOps",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        icons: [],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png}"] },
    }),
  ],
});
