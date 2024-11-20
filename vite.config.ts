import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs-extra';

// Custom plugin to copy data directory
const copyDataDirPlugin = () => ({
  name: 'copy-data-dir',
  closeBundle: async () => {
    await fs.copy('data', 'dist/');
  }
});

export default defineConfig({
  plugins: [
    react(),
    copyDataDirPlugin()
  ],
  publicDir: 'public',
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react']
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
});