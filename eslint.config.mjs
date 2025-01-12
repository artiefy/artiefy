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
    ]
  },
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      'plugin:@typescript-eslint/recommended-type-checked',
      'plugin:@typescript-eslint/stylistic-type-checked',
      'plugin:tailwindcss/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: true,
    },
    plugins: [
      '@typescript-eslint',
      'drizzle',
      'tailwindcss',
      'jsx-a11y',
      'import',
    ],
    rules: {
      'tailwindcss/no-custom-classname': 'warn',
      'tailwindcss/classnames-order': 'warn',
      "@typescript-eslint/consistent-type-definitions": "warn",
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
            attributes: false,
          },
        },
      ],
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
          'groups': ['builtin', 'external', 'internal', ['parent', 'sibling']],
          'pathGroups': [
            {
              'pattern': 'react',
              'group': 'external',
              'position': 'before'
            },
            {
              'pattern': '@/components/**',
              'group': 'internal',
              'position': 'after'
            }
          ],
          'pathGroupsExcludedImportTypes': ['react'],
          'alphabetize': {
            'order': 'asc',
            'caseInsensitive': true
          }
        }
      ],
      'import/newline-after-import': 'warn',
    },
    settings: {
      tailwindcss: {
        config: './tailwind.config.ts',
        cssFiles: [
          './src/**/*.css',
          './styles/globals.css',
        ],
      },
      next: {
        rootDir: './',
      },
    },
  }),
];

export default eslintConfig;

