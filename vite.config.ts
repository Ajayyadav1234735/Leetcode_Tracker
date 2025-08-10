import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'client'), // frontend root
  build: {
    outDir: resolve(__dirname, 'dist'), // build output
    emptyOutDir: true,
  },
});
