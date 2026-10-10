import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default defineConfig([
  globalIgnores(['.next/**', 'test-results/**', 'playwright-report/**', 'next-env.d.ts']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
]);
