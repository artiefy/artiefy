/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
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
};

export default config;
