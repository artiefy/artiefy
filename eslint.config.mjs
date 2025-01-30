import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      '**/*.d.ts',
      'src/components/estudiantes/ui/**',
      'src/components/admin/ui/**',
      'src/components/educadores/ui/**',
    ],
  },
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      'next/typescript',
      'plugin:@next/next/recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-type-checked',
      'plugin:@typescript-eslint/stylistic-type-checked',
      'plugin:tailwindcss/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
    },
    plugins: ['@typescript-eslint', 'drizzle', 'tailwindcss', 'import'],
    rules: {
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          config: './tailwind.config.js',
          cssFiles: [
            '**/*.css',
            '!**/node_modules',
            '!**/.*',
            '!**/dist',
            '!**/build',
          ],
          cssFilesRefreshRate: 5000,
          callees: ['classnames', 'clsx', 'ctl'],
          tags: ['tw'],
        },
      ],
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/enforces-negative-arbitrary-values': 'warn',
      'tailwindcss/enforces-shorthand': 'warn',
      'tailwindcss/migration-from-tailwind-2': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      '@typescript-eslint/consistent-type-definitions': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/require-await': 'warn',
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
      'drizzle/enforce-delete-with-where': [
        'warn',
        {
          drizzleObjectName: ['db', 'ctx.db'],
        },
      ],
      'drizzle/enforce-update-with-where': [
        'warn',
        {
          drizzleObjectName: ['db', 'ctx.db'],
        },
      ],
      '@next/next/google-font-display': 'warn',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/components/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'import/no-unresolved': 'error',
      'import/newline-after-import': 'off',
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [['~', './src']],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      react: {
        version: 'detect',
      },
      tailwindcss: {
        config: './tailwind.config.js',
        cssFiles: [
          '**/*.css',
          '!**/node_modules',
          '!**/.*',
          '!**/dist',
          '!**/build',
        ],
        callees: ['classnames', 'clsx', 'ctl'],
        tags: ['tw'],
        classRegex: '^class(Name)?$',
        cssFilesRefreshRate: 5000,
        skipClassAttribute: false,
        exposeConfiguration: true,
        future: {
          purgeLayersByDefault: true,
        },
        removeDeprecatedUtilities: true,
      },
      next: {
        rootDir: './',
      },
      files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    },
  }),
];

export default eslintConfig;
