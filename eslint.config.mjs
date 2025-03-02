import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat({
	baseDirectory: import.meta.dirname,
	recommendedConfig: js.configs.recommended,
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
	{
		files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
	},
	...compat.config({
		extends: [
			'next/core-web-vitals',
			'plugin:@typescript-eslint/recommended',
			'plugin:@typescript-eslint/recommended-type-checked',
			'plugin:@typescript-eslint/stylistic-type-checked',
			'plugin:import/recommended',
			'plugin:import/typescript',
			'plugin:@next/next/recommended',
			'prettier',
		],
		parser: '@typescript-eslint/parser',
		parserOptions: {
			project: './tsconfig.json',
			tsconfigRootDir: import.meta.dirname,
		},
		plugins: ['@typescript-eslint', 'drizzle', 'import'],
		rules: {
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
			'import/no-unresolved': 'warn',
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
			next: {
				rootDir: './',
			},
		},
	}),
];

export default eslintConfig;