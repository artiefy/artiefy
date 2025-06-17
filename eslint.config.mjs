// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default tseslint.config(
  // Base configurations
  js.configs.recommended,

  // Next.js 15 specific configurations
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),

  // React configurations - Fixed for TypeScript
  reactPlugin.configs.flat?.recommended ?? {},
  reactPlugin.configs.flat?.['jsx-runtime'] ?? {},

  // TypeScript configurations
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      'dist/**',
      'build/**',
      '**/*.d.ts',
      '.vercel/**',
      'coverage/**',
      '.turbo/**',
      // 🔽 Ignorar carpetas de UI específicas
      'src/components/estudiantes/ui/**',
      'src/components/educadores/ui/**',
      'src/components/admin/ui/**',
      'src/components/super-admin/ui/**',
    ],
  },

  // Main configuration
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      react: {
        version: 'detect',
        runtime: 'automatic',
      },
      next: {
        rootDir: './',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      // ===== TYPESCRIPT RULES =====
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/no-misused-promises': [
        'warn',
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off',

      // ===== REACT RULES =====
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-closing-bracket-location': ['warn', 'line-aligned'],
      'react/jsx-curly-brace-presence': [
        'warn',
        { props: 'never', children: 'never' },
      ],
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/jsx-no-useless-fragment': 'warn',
      'react/hook-use-state': 'error',
      'react/no-invalid-html-attribute': 'warn',
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/self-closing-comp': ['warn', { component: true, html: true }],
      'react/jsx-key': 'error',
      'react/no-unescaped-entities': 'warn',

      // ===== REACT HOOKS RULES =====
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks:
            '(useQuery|useMutation|useInfiniteQuery|useSuspenseQuery)',
        },
      ],

      // ===== NEXT.JS 15 SPECIFIC RULES =====
      '@next/next/google-font-display': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-page-custom-font': 'warn',
      '@next/next/no-unwanted-polyfillio': 'error',

      // ===== GENERAL RULES =====
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',

      // ===== IMPORT SORTING RULES (AUTO-ORGANIZE) =====
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // React and Next.js imports first
            ['^react$', '^react/'],
            ['^next', '^@next'],

            // External packages
            ['^@?\\w'],

            // Internal imports with aliases
            ['^@/', '^~/'],

            // Parent imports
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],

            // Same-folder imports
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],

            // Type imports (should be last)
            ['^.+\\u0000$'],

            // Style imports (CSS, SCSS, etc.)
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Additional import rules for better organization
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
    },
  },

  // Disable type-checked rules for JS files
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Configuration for test files
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Configuration for config files
  {
    files: [
      '*.config.{js,ts,mjs}',
      'tailwind.config.{js,ts}',
      'next.config.{js,ts,mjs}',
    ],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  }
);
