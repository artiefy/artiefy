module.exports = {
  // Run Prettier first, then ESLint autofix for JS/TS files
  // prettier then eslint; use unix formatter to show file:line:col paths clearly
  '*.{js,jsx,ts,tsx}': [
    'prettier --write',
    // 'stylish' is the default formatter and prints file paths and locations
    'eslint --fix --max-warnings 0 --format stylish',
  ],

  // Format common text/config files
  '*.{json,md,mdx,css,yml,yaml}': ['prettier --write'],

  // Run full TypeScript typecheck when there are TS files staged.
  // Use a function so lint-staged won't append file paths to the command
  // (tsc ignores tsconfig.json when files are passed as CLI args).
  '*.{ts,tsx}': [
    (files) => {
      // lint-staged requires the function to return a string or an array of strings.
      // Return an empty array to skip the task when there are no TS files staged.
      if (!Array.isArray(files) || files.length === 0) return [];
      return 'tsc --noEmit';
    },
  ],
};
