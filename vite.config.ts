import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,  // ✅ Ensure local dev works properly
  },
  build: {
    outDir: "dist",  // ✅ Ensure Vite outputs to the correct folder
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
