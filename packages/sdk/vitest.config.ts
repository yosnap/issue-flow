/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      crypto: 'node:crypto',
    },
  },
});