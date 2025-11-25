import eslintPluginNext from '@next/eslint-plugin-next';

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import drizzlePlugin from 'eslint-plugin-drizzle';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Global ignores
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
      'src/components/estudiantes/ui/**',
      'src/components/educadores/ui/**',
      'src/components/admin/ui/**',
      'src/components/super-admin/ui/**',
      'src/components/reactbits/**',
    ],
  },

  // Main configuration
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.eslint.json',
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
      '@next/next': eslintPluginNext,
      import: importPlugin,
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
      // ===== TYPESCRIPT RULES =====
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
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
      '@typescript-eslint/no-floating-promises': 'off',
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

      // ===== NEXT.JS CORE RULES (TODAS LAS OFICIALES) =====
      // Font optimization rules
      '@next/next/google-font-display': 'error',
      '@next/next/google-font-preconnect': 'error',
      '@next/next/no-page-custom-font': 'error',

      // Script optimization rules
      '@next/next/inline-script-id': 'error',
      '@next/next/next-script-for-ga': 'error',
      '@next/next/no-before-interactive-script-outside-document': 'error',
      '@next/next/no-script-component-in-head': 'error',
      '@next/next/no-sync-scripts': 'error',

      // Image optimization rules
      '@next/next/no-img-element': 'error',

      // Document/Head management rules
      '@next/next/no-css-tags': 'error',
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-duplicate-head': 'error',
      '@next/next/no-head-element': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-styled-jsx-in-document': 'error',
      '@next/next/no-title-in-document-head': 'error',

      // Navigation rules
      '@next/next/no-html-link-for-pages': 'error',

      // Module and code quality rules
      '@next/next/no-assign-module-variable': 'error',
      '@next/next/no-async-client-component': 'error',
      '@next/next/no-typos': 'error',

      // Performance rules
      '@next/next/no-unwanted-polyfillio': 'error',

      'no-var': 'error',

      // ===== WEB VITALS OPTIMIZATION RULES =====
      // Las reglas de Next.js ya cubren Core Web Vitals:
      // LCP: @next/next/no-img-element, google-font-display
      // FID/INP: @next/next/no-sync-scripts
      // CLS: @next/next/google-font-preconnect

      // Performance adicionales para Web Vitals
      'no-console': 'off',

      // ===== IMPORT SORTING RULES =====
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

            // Type imports
            ['^.+\\u0000$'],

            // Style imports
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'warn',

      // Additional import rules
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'off',
      'import/first': 'error',

      // ===== DRIZZLE RULES =====
      'drizzle/enforce-delete-with-where': [
        'error',
        {
          drizzleObjectName: ['db'],
        },
      ],
      'drizzle/enforce-update-with-where': [
        'error',
        {
          drizzleObjectName: ['db'],
        },
      ],
    },
  },

  // Disable type-checked rules for JS files
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Test files configuration
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Config files configuration
  {
    files: [
      '*.config.{js,ts,mjs}',
      'tailwind.config.{js,ts}',
      'next.config.{js,ts,mjs}',
    ],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-anonymous-default-export': 'off',
      'no-console': 'off', // Permite console en archivos de configuración
    },
  },

  // Core Web Vitals strict configuration para production
  {
    files: ['src/app/**/*.{js,jsx,ts,tsx}', 'pages/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Reglas más estrictas para páginas que afectan Web Vitals
      '@next/next/no-img-element': 'error',
      '@next/next/google-font-display': 'error',
      '@next/next/google-font-preconnect': 'error',
      '@next/next/no-sync-scripts': 'error',
      'react-hooks/exhaustive-deps': 'error', // Más estricto en páginas
    },
  },

  // Prettier should be last
  prettier,
];
