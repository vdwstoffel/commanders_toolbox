import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    https: {
      key: "./localhost-key.pem",
      cert: "./localhost.pem",
    },
    proxy: {
      "/api": {
        target: "http://server:8080",
        changeOrigin: true,
      },
    },
    host: true,
  },
});
