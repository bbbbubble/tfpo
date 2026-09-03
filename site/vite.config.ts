import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/tfpo/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': root,
    },
  },
  build: {
    outDir: 'dist-pages',
    emptyOutDir: true,
  },
});
