import betterTailwindCSS from 'eslint-plugin-better-tailwindcss';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': typescriptEslint,
      'better-tailwindcss': betterTailwindCSS,
    },
    settings: {
      react: {
        version: '19.2',
      },
      'better-tailwindcss': {
        entryPoint: 'src/styles/globals.css',
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': [
        'off',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'no-console': [
        'off',
        {
          allow: ['warn', 'error'],
        },
      ],
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^react$', '^react/'],
            ['^next', '^@next'],
            ['^@?\\w'],
            ['^@/', '^~/'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\u0000$'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'off',
      'jsx-a11y/alt-text': 'off',
      'no-undef': 'off',
      // Better Tailwind CSS
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      // Mantener wrapping de Tailwind con saltos de línea y grupos "normal",
      // pero compatible con formatters al guardar (Prettier + ESLint).
      'better-tailwindcss/enforce-consistent-line-wrapping': [
        'warn',
        {
          printWidth: 80,
          classesPerLine: 0,
          group: 'newLine',
          preferSingleLine: false,
          // Mantiene la sangría multilínea estándar del proyecto.
          indent: 2,
          lineBreakStyle: 'unix',
          // Recomendado por el plugin cuando convive con Prettier/Biome.
          strictness: 'loose',
        },
      ],
      'react/display-name': 'off',
    },
  },
  {
    files: ['server.js', 'server.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
    },
  },
  globalIgnores(
    [
      '**/node_modules/**',
      '.agents/**',
      '.github/**',
      'Docs/**',
      '.next/**',
      'out/**',
      'public/**',
      'dist/**',
      'build/**',
      '.vercel/**',
      'coverage/**',
      '.turbo/**',
      'videos/**',
      'drizzle/**',
      'scripts/**',
      '**/.git/**',
      '**/.husky/**',
      '**/.lintstagedrc*',
      '**/.eslintcache',
      '**/.prettierignore',
      '**/eslint.config.*',
      '**/eslint.cli.config.*',
      '**/*.{config,conf}.{js,cjs,mjs,ts}',
      'next-env.d.ts',
      '**/*.d.ts',
      '.vscode/**',
      '.idea/**',
      '**/*.swp',
      '**/*.swo',
      '**/Thumbs.db',
      '**/Desktop.ini',
      '**/.DS_Store',
      '**/.gitkeep',
      'src/components/estudiantes/ui/**',
      'src/components/educadores/ui/**',
      'src/components/admin/ui/**',
      'src/components/super-admin/ui/**',
      'src/components/reactbits/**',
    ],
    'global-ignores'
  ),
  // 4. Prettier (debe ir al final para desactivar conflictos)
  prettier,
]);
