import betterTailwindCSS from 'eslint-plugin-better-tailwindcss';
import drizzle from 'eslint-plugin-drizzle';
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
        // No `project` / `projectService` here on purpose.
        //
        // This config is the one the editor loads on every keystroke. Neither
        // `eslint-config-next/typescript` (which is typescript-eslint's
        // `recommended`, not `recommendedTypeChecked`) nor any rule below needs
        // type information, so building a full TypeScript program here only
        // bought editor lag.
        //
        // Type-aware rules live in `eslint.cli.config.mjs`, which points at
        // `tsconfig.eslint.json` and runs on lint-staged, `npm run check` and CI.
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
      drizzle,
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
      // The core React rule: hooks must not be called conditionally, in loops,
      // or outside a component. Breaking it corrupts hook state at runtime and
      // no type-checker catches it. Keep this at 'error'.
      'react-hooks/rules-of-hooks': 'error',
      'no-console': 'off',
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
      // Drizzle ORM
      'drizzle/enforce-delete-with-where': [
        'error',
        { drizzleObjectName: ['db'] },
      ],
      'drizzle/enforce-update-with-where': [
        'error',
        { drizzleObjectName: ['db'] },
      ],
      // Better Tailwind CSS
      'better-tailwindcss/no-unnecessary-whitespace': 'warn',
      'better-tailwindcss/no-duplicate-classes': 'warn',
      'better-tailwindcss/enforce-shorthand-classes': 'warn',
      // Mantener wrapping de Tailwind con saltos de línea y grupos "normal",
      // pero compatible con formatters al guardar (Prettier + ESLint).
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'react/display-name': 'off',
    },
  },
  {
    // Narrow, temporary carve-out for `react-hooks/rules-of-hooks`, which is
    // 'error' everywhere else.
    //
    // This file holds `_EducatorsList` (around line 1832): a component that is
    // defined but never rendered, kept on purpose in case it is needed again.
    // The leading underscore silences `no-unused-vars`, but it also stops the
    // name from reading as a React component, so the rule flags the `useState`
    // calls inside it. The code is unreachable, so those two reports describe
    // no real runtime risk.
    //
    // Scope is one file, not the project: every other component keeps the rule.
    // Delete this block when `_EducatorsList` is removed or brought back into
    // real use under a proper component name.
    files: ['src/app/dashboard/super-admin/**/CourseDetail.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
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
  {
    // Cache Components guardrail.
    //
    // Modules under `src/server/**` and `src/models/**` are the shared data
    // layer: the same functions back student pages, dashboard pages, the PayU
    // thank-you page, cron jobs and webhooks. A `use cache` directive placed
    // here would cache every one of those callers at once, including the ones
    // that must always read live data.
    //
    // The worst case is not stale content but stale authorization: caching a
    // helper such as `isCourseOwnedByEducator` would keep serving a revoked
    // educator's permission from cache.
    //
    // Cache at the call site instead — see `src/app/estudiantes/_cache/`.
    files: ['src/server/**/*.{ts,tsx}', 'src/models/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExpressionStatement > Literal[value=/^use cache/]',
          message:
            'Do not use `use cache` in the shared data layer: these modules are also consumed by API routes, cron jobs and webhooks. Wrap the call in a cached function at the call site (see src/app/estudiantes/_cache/).',
        },
      ],
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
