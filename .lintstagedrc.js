module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix --max-warnings 0', // Corrige errores automáticamente
    'prettier --write', // Formatea código
  ],
  '*.{json,md,mdx,css,yml,yaml}': [
    'prettier --write', // Formatea otros archivos
  ],
};
