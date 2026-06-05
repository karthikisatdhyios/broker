import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API + uploaded images to the backend during development.
      '/api': 'http://localhost:5200',
      '/uploads': 'http://localhost:5200',
    },
  },
});
