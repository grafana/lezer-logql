import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.js'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
