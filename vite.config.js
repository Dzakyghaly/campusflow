import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["favicon.ico", "apple-touch-icon.png"],

      manifest: {
        name: "CampusFlow - Student Workspace",
        short_name: "CampusFlow",

        description:
          "Student workspace untuk mengelola tugas, jadwal kuliah, mata kuliah, pembayaran, catatan, kehadiran, nilai, dan kalender akademik.",

        theme_color: "#0f172a",
        background_color: "#0f172a",

        display: "standalone",

        start_url: "/",
        scope: "/",

        orientation: "any",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
