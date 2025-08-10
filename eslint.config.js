import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfig([
    { files: ['**/*.{ts,tsx,js,jsx,vue}'] },
    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    // Základ
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],

    // TypeScript (type-checked)
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/*.{ts,tsx,vue}'],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: ['.vue'],
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
        },
    },

    skipFormatting,
])
