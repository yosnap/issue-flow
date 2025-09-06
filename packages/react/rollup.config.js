const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: ['@issueflow/sdk'],
  plugins: [
    peerDepsExternal(),
    nodeResolve({
      preferBuiltins: false,
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
    }),
  ],
};