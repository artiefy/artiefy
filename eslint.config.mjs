// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import drizzlePlugin from 'eslint-plugin-drizzle';
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

  // Next.js 15 specific configurations usando FlatCompat como fallback
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'prettier'],
  }),

  // TypeScript configurations
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // React configurations - Fixed for TypeScript
  reactPlugin.configs.flat?.recommended ?? {},
  reactPlugin.configs.flat?.['jsx-runtime'] ?? {},

  // Drizzle configurations
  drizzlePlugin.configs.recommended,

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
      // Ignorar carpetas de UI específicas
      'src/components/estudiantes/ui/**',
      'src/components/educadores/ui/**',
      'src/components/admin/ui/**',
      'src/components/super-admin/ui/**',
    ],
  },

  // Next.js Plugin Configuration usando el plugin directamente
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      // ===== NEXT.JS PLUGIN RULES (usando el plugin directo) =====
      
      // Recommended rules from Next.js plugin (warnings)
      '@next/next/google-font-display': 'warn',
      '@next/next/google-font-preconnect': 'warn',
      '@next/next/next-script-for-ga': 'warn',
      '@next/next/no-async-client-component': 'warn',
      '@next/next/no-before-interactive-script-outside-document': 'warn',
      '@next/next/no-css-tags': 'warn',
      '@next/next/no-head-element': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-page-custom-font': 'warn',
      '@next/next/no-styled-jsx-in-document': 'warn',
      '@next/next/no-sync-scripts': 'warn',
      '@next/next/no-title-in-document-head': 'warn',
      '@next/next/no-typos': 'warn',
      '@next/next/no-unwanted-polyfillio': 'warn',

      // Recommended rules from Next.js plugin (errors)
      '@next/next/inline-script-id': 'error',
      '@next/next/no-assign-module-variable': 'error',
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-duplicate-head': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-script-component-in-head': 'error',
    },
  },

  // Core Web Vitals specific configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      // Core Web Vitals rules (más estrictos)
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-img-element': 'error', // Usar next/image en su lugar
      // Reglas adicionales del primer archivo más estrictas
      '@next/next/google-font-display': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-page-custom-font': 'warn',
      '@next/next/no-unwanted-polyfillio': 'error',
    },
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
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
      drizzle: drizzlePlugin,
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
      // ===== DRIZZLE RULES =====
      'drizzle/enforce-delete-with-where': [
        'error',
        {
          drizzleObjectName: ['db', 'database'],
        },
      ],
      'drizzle/enforce-update-with-where': [
        'error',
        {
          drizzleObjectName: ['db', 'database'],
        },
      ],

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
      'react/jsx-closing-bracket-location': ['warn', 'line-aligned'],
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/no-invalid-html-attribute': 'warn',
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

      // ===== GENERAL RULES =====
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-console': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',

      // ===== IMPORT SORTING RULES (AUTO-ORGANIZE) =====
      'simple-import-sort/imports': [
        'warn',
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
      'simple-import-sort/exports': 'warn',

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
      '@next/next/no-img-element': 'off', // Permitir img en tests
      // Relajar reglas de Drizzle en tests
      'drizzle/enforce-delete-with-where': 'off',
      'drizzle/enforce-update-with-where': 'off',
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
  },

  // Database/Migration files specific rules
  {
    files: [
      '**/db/**/*.{js,jsx,ts,tsx}',
      '**/database/**/*.{js,jsx,ts,tsx}',
      '**/migrations/**/*.{js,jsx,ts,tsx}',
      '**/drizzle/**/*.{js,jsx,ts,tsx}',
    ],
    rules: {
      // Permitir operaciones de base de datos sin WHERE en migraciones y configuraciones
      'drizzle/enforce-delete-with-where': 'warn',
      'drizzle/enforce-update-with-where': 'warn',
    },
  },

  // Pages directory specific rules (si usas pages router)
  {
    files: ['pages/**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': ['error', 'pages/'],
    },
  },

  // App directory specific rules (si usas app router)
  {
    files: ['app/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': ['error', 'app/'],
    },
  }
);