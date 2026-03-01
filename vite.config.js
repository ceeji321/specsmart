// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // allows access from phone/other devices on same network
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://specsmart-production.up.railway.app',
        changeOrigin: true,
      }
    }
  }
});