import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'IssueFlowVue',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'issueflow-vue.js' : 'issueflow-vue.umd.cjs'
    },
    rollupOptions: {
      external: ['vue', '@issueflow/sdk'],
      output: {
        globals: {
          vue: 'Vue',
          '@issueflow/sdk': 'IssueFlowSDK'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return assetInfo.name;
        }
      }
    },
    sourcemap: true,
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});