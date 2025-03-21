/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */

const config = {
  plugins: ['prettier-plugin-tailwindcss'],

  // 🔹 Tailwind CSS 4 usa `tailwindStylesheet`
  tailwindStylesheet: './src/styles/globals.css',

  // 🔹 Formato General
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  printWidth: 80,
  useTabs: true,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  jsxSingleQuote: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
};

export default config;
