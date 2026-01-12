/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions}
 */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],
  semi: true,
  tailwindStylesheet: './src/styles/globals.css',
  singleQuote: true,
  tabWidth: 2,
  printWidth: 80,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  // Sin overrides de parser: dejamos que Prettier use sus parsers por defecto
  // (babel/typescript), que sí están soportados por prettier-plugin-tailwindcss.
};

export default config;
