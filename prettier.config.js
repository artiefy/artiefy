/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./tailwind.config.js", // Ruta a tu archivo de configuración de Tailwind CSS
  semi: true, // Añadir punto y coma al final de las declaraciones
  singleQuote: true, // Usar comillas simples en lugar de comillas dobles
  tabWidth: 2, // Tamaño de tabulación
  trailingComma: "all", // Añadir coma al final de listas y objetos
  printWidth: 80, // Ancho máximo de línea
  bracketSpacing: true, // Espacio entre llaves en objetos
  arrowParens: "always", // Paréntesis alrededor de argumentos de funciones flecha
};

export default config;
