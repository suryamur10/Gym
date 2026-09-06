import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API server runs separately (see /server). In dev we proxy /api to it so
// the browser talks to a single origin and there's no CORS in the way.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
