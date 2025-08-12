import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for prod
    chunkSizeWarningLimit: 1000
  }
});
