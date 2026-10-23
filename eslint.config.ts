import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from 'eslint-config-prettier/flat'
export default defineConfig(
  globalIgnores([
    'dist/**',
    'node_modules/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.agents/**',
    '*.html',
  ]),
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
  skipFormatting,
)
