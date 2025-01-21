import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080
  },
  define: {
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react',
        'react-dom'
      ],
    },
  },
  base: './'
});
