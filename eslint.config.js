import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import pluginQuery from '@tanstack/eslint-plugin-query'

// Tanstack Queryプラグインのルールを直接展開するのではなく、明示的に設定
const queryRules = {};
if (pluginQuery.configs['flat/recommended']?.rules) {
  Object.entries(pluginQuery.configs['flat/recommended'].rules).forEach(([key, value]) => {
    queryRules[key] = value;
  });
}

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@tanstack/query': pluginQuery,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // ...pluginQuery.configs['flat/recommended'],
      // 明示的に展開したルールを使用
      ...queryRules,
    },
  },
)
