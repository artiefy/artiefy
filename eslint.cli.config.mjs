// eslint.cli.config.mjs
// ESLint configuration for CI/CLI — STRICT, WITH FULL TYPE CHECKING
//
// Extends the base config (eslint.config.mjs) and adds type-checked rules.
// Type-checked linting is SLOW and memory-hungry, so it only runs in:
//   - npm run lint
//   - npm run check
//   - Pre-commit hooks (lint-staged)
//   - CI/CD pipelines
//
// Do NOT point VS Code at this config: it will lag badly. The editor loads
// eslint.config.mjs, which carries no type information on purpose.
//
// Pattern based on: https://github.com/vercel/next.js/blob/canary/eslint.cli.config.mjs
//
// No `ignores` block here: everything that used to be listed (next.config.ts,
// prettier.config.mjs, lint-staged.config.mjs, .next, node_modules and the
// eslint configs themselves) is already covered by `globalIgnores` in the base
// config, so repeating it only risked the two lists drifting apart.

import { defineConfig } from 'eslint/config';

import baseConfig from './eslint.config.mjs';

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // Narrowed project, deliberately not `projectService: true`. Measured
        // over src/app/dashboard the service is slower (78s vs 62s) because it
        // loads the full tsconfig.json instead of this reduced file set.
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ==========================================
      // TYPE-CHECKED RULES — ENABLED
      // ==========================================
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: false }, // allow promises in event handlers
      ],
      '@typescript-eslint/await-thenable': 'error',

      // ==========================================
      // TYPE-CHECKED RULES — DISABLED
      // ==========================================
      // Each of these still reports too many pre-existing violations to gate
      // on. They are turned off globally and re-enabled per directory below as
      // the code gets cleaned, rather than left off forever.
      '@typescript-eslint/no-floating-promises': 'off', // 78 violations app-wide
      '@typescript-eslint/switch-exhaustiveness-check': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  {
    // Server layer, API routes and shared helpers: verified free of floating
    // promises, so the rule is gated here at zero cost to the current tree.
    //
    // This is where a dropped promise actually costs something: a PayU payment
    // confirmation, a Drizzle write, an S3 upload or a webhook that settles
    // after the response was already sent, failing silently in production.
    //
    // Clean at the time of writing across 120 files in src/server, 332 in
    // src/app/api, plus src/lib, src/models and src/utils. The UI trees
    // (src/components, src/app/dashboard) still carry violations and are not
    // covered yet.
    files: [
      'src/server/**/*.{ts,tsx}',
      'src/app/api/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
      'src/models/**/*.{ts,tsx}',
      'src/utils/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
]);
