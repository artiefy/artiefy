import betterTailwindCSS from 'eslint-plugin-better-tailwindcss';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        project: './tsconfig.eslint.json',
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
      'react/display-name': 'off',
    },
  },
  // 3. Prettier (debe ir después para desactivar conflictos)
  prettier,

  // 4. Archivos ignorados
  {
    ignores: [
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
      'test/**',
      'scripts/**',
      '**/.git/**',
      '**/.husky/**',
      '**/.lintstagedrc*',
      '**/.eslintcache',
      '**/.prettierignore',
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
  },
]);
