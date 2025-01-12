//prettier.config.mjs
/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  semi: true, // Usar punto y coma al final
  singleQuote: true, // Usar comillas simples
  trailingComma: 'es5', // Colocar coma en elementos multi-línea
  printWidth: 80, // Longitud máxima por línea
  tabWidth: 2, // Tamaño del tabulador
  useTabs: false, // Usar espacios en lugar de tabs
  arrowParens: 'always', // Paréntesis en funciones flecha con un solo argumento
  endOfLine: 'lf', // Línea de fin LF
  jsxSingleQuote: false, // Usar comillas dobles en JSX
  organizeImports: true // Ordena automáticamente las clases de Tailwind.
};
export default config;
