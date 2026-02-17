import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // If port 5173 is taken, automatically try the next available port
    host: true, // Listen on all addresses
    open: false, // Don't auto-open browser
    proxy: {
    '/api': {
         target: 'http://127.0.0.1:5000',
         changeOrigin: true,
         secure: false
      }
    }
  },
});
