import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This config is safe for both local dev and Render
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
