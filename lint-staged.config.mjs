// lint-staged.config.mjs
// Configuración para pre-commit hooks
// Usa la configuración CLI con type-checking completo

const config = {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'node --max-old-space-size=8192 ./node_modules/eslint/bin/eslint.js --config eslint.cli.config.mjs --max-warnings=0 --no-warn-ignored --fix --cache --cache-location .eslintcache',
    'prettier --write --cache',
  ],

  // JSON, Markdown, YAML, CSS, HTML
  '**/*.{json,md,mdx,css,scss,yml,yaml,html}': [
    'prettier --write --cache',
  ],

  // TypeScript type checking (solo archivos staged)
  // Type checking moved to pre-push (npm run typecheck) to avoid blocking commits
};

export default config;
