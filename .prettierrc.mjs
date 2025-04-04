/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	// Add schema validation
	$schema: 'https://json.schemastore.org/prettierrc',

	// Plugins
	plugins: ['prettier-plugin-tailwindcss'],

	// Base configuration
	printWidth: 80,
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: true,
	trailingComma: 'es5',
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: 'always',
	endOfLine: 'lf',
	singleAttributePerLine: false,

	// Language-specific settings
	htmlWhitespaceSensitivity: 'css',
	jsxSingleQuote: false,
	proseWrap: 'preserve',
	embeddedLanguageFormatting: 'auto',

	// File-specific overrides
	overrides: [
		{
			files: ['*.xml'],
			options: {
				parser: 'html',
				printWidth: 120,
				htmlWhitespaceSensitivity: 'ignore',
				bracketSameLine: true,
				vueIndentScriptAndStyle: false,
				singleQuote: false,
				bracketSpacing: true,
				useTabs: true,
			},
		},
		{
			files: ['*.json', '*.jsonc', '*.json5', '.prettierrc'],
			options: {
				parser: 'json',
				trailingComma: 'none',
			},
		},
		{
			files: ['*.ts', '*.tsx'],
			options: {
				parser: 'typescript',
			},
		},
		{
			files: ['*.js', '*.jsx', '*.mjs', '*.cjs'],
			options: {
				parser: 'babel',
			},
		},
		{
			files: ['*.css', '*.scss', '*.less'],
			options: {
				parser: 'css',
				singleQuote: false,
			},
		},
		{
			files: ['*.html'],
			options: {
				parser: 'html',
				htmlWhitespaceSensitivity: 'css',
			},
		},
		{
			files: ['*.md', '*.mdx'],
			options: {
				parser: 'markdown',
				proseWrap: 'always',
				printWidth: 80,
			},
		},
	],
};

export default config;
