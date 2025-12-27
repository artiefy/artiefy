/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions}
 */
const config = {
  plugins: ['prettier-plugin-tailwindcss', '@prettier/plugin-oxc'],
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 80,
  trailingComma: "es5",
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'oxc',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'oxc-ts',
      },
    },
  ],
};

export default config;
