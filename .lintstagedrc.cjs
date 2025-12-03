module.exports = {
  // Ejecuta ESLint con --max-warnings=0 para bloquear errores y warnings, luego Prettier para formatear
  '*.{js,jsx,ts,tsx}': ['eslint --max-warnings=0 --fix', 'prettier --write'],
  // Formatea archivos de texto y config
  '*.{json,md,mdx,css,yml,yaml,html}': 'prettier --write',
};
