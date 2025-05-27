/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions}
 */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 80,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};

export default config;
