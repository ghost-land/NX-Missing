import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'data',
  server: {
    fs: {
      strict: false,
      allow: ['data']
    }
  }
});