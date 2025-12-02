module.exports = {
  // Run Prettier first, then ESLint autofix for JS/TS files
  '*.{js,jsx,ts,tsx}': [
    'prettier --write',
    'eslint --fix --max-warnings 0',
  ],

  // Format common text/config files
  '*.{json,md,mdx,css,yml,yaml}': [
    'prettier --write',
  ],

  // Run full TypeScript typecheck when there are TS files staged.
  // Use a function so lint-staged won't append file paths to the command
  // (tsc ignores tsconfig.json when files are passed as CLI args).
  '*.{ts,tsx}': [async (files) => {
    if (!files || files.length === 0) return
    return 'tsc --noEmit'
  }]
}
