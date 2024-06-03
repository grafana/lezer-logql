import { nodeResolve } from '@rollup/plugin-node-resolve';
import multi from '@rollup/plugin-multi-entry';
import combine from 'rollup-plugin-combine';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: ['src/parser.js'],
  output: [
    {
      format: 'cjs',
      file: './dist/index.cjs',
    },
    {
      format: 'es',
      file: './dist/index.es.js',
    },
  ],
  external(id) {
    if (id === 'index.js') return false;
    return !/^[./]/.test(id);
  },
  plugins: [
    multi(),
    combine(),
    nodeResolve(),
    commonjs({
      requireReturnsDefault: 'auto',
    }),
  ],
};
