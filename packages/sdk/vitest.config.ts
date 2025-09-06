/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [],
    pool: 'forks',
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"test"',
  },
  resolve: {
    alias: {
      crypto: 'node:crypto',
    },
  },
  esbuild: {
    target: 'node18',
  },
});