import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While developing, the React app runs on http://localhost:5173 and passes
// every /api and /uploads request on to the backend on port 3001.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
