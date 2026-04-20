import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

const APP_PORT = 10010;

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: APP_PORT,
    proxy: {
      "/api": {
        target: "http://localhost:10086",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: APP_PORT,
  },
});
