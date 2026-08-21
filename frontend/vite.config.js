import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While I am developing, the React app runs on port 5173 and the API on 5000.
// The proxy sends anything starting with /api over to the API so I do not have to
// deal with CORS or write full URLs in my fetch calls.
//
// On the EC2 box this proxy is not used at all, because there the built files are
// served by the same express server that answers /api.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
