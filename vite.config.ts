import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist", // Ensure correct output folder
  },
  server: {
    port: 5173, // Default for Vite, adjust if needed
  },
  preview: {
    port: 4173, // Default Vite preview port
  }
});
