// https://eslint.vuejs.org/user-guide/
import eslintPluginVue from 'eslint-plugin-vue';
import js from '@eslint/js';
import ts from 'typescript-eslint';

export default [
  {
    ignores: ['dist-pkg', 'node_modules']
  },
  // Base JS settings
  js.configs.recommended,
  ...ts.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  // TypeScript settings
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    rules: {
      // JavaScript-specific rules
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',

      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'warn'
    }
  },
  // Vue plugin settings
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    rules: {
      // Vue-specific rules
      'no-undef': 'warn',

      '@typescript-eslint/no-unused-vars': 'warn',
      'vue/attribute-hyphenation': 'warn',
      'vue/attributes-order': 'error',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/order-in-components': 'error',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/this-in-template': 'error'
    }
  }
];
