import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/api/google-auth': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/api/gdrive-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets', // Explicitly set assets directory
    rollupOptions: {
      output: {
        // Ensure consistent chunking
        manualChunks: undefined,
        // Control asset file names
        assetFileNames: 'assets/[name].[hash].[ext]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      }
    },
  },
  // Change base to '/' for production builds
  base: '/',
  // Remove the resolve alias as it's redundant
  // react and react-dom are already handled by Vite
});
