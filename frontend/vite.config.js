import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/graphql': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split large vendor libraries into separate chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-apollo': ['@apollo/client', 'graphql'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
});
