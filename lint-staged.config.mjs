// lint-staged.config.mjs
// Configuración para pre-commit hooks
// Usa la configuración CLI con type-checking completo

const config = {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --config eslint.cli.config.mjs --max-warnings=0 --no-warn-ignored --fix',
    'prettier --write',
  ],

  // JSON, Markdown, YAML, CSS, HTML
  '**/*.{json,md,mdx,css,scss,yml,yaml,html}': ['prettier --write'],

  // TypeScript type checking (solo archivos staged)
  '**/*.{ts,tsx}': () => 'tsc --noEmit',
};

export default config;
