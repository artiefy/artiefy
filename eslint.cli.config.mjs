// eslint.cli.config.mjs
// Configuración ESLint para CI/CLI - ESTRICTA CON TYPE-CHECKING COMPLETO
//
// Esta configuración extiende la base (eslint.config.mjs) y agrega reglas type-checked.
// El linting con reglas type-checked es MUY LENTO y consume mucha memoria,
// por lo que solo se usa en:
//   - npm run lint
//   - npm run check
//   - Pre-commit hooks (lint-staged)
//   - CI/CD pipelines
//
// ⚠️ NO usar en VS Code directamente - causará lag significativo.
// Patrón basado en: https://github.com/vercel/next.js/blob/canary/eslint.cli.config.mjs

import { defineConfig } from 'eslint/config';

import baseConfig from './eslint.config.mjs';

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['run-migration.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json', // Usa el tsconfig específico para ESLint
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // Estas reglas se agregan encima de las reglas declaradas en la config base
    rules: {
      // ==========================================
      // REGLAS TYPE-CHECKED CRÍTICAS
      // ==========================================
      '@typescript-eslint/no-floating-promises': 'off', // Promesas sin await
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false, // Permite promesas en event handlers
        },
      ],
      '@typescript-eslint/await-thenable': 'error', // await en valores no-promise
      '@typescript-eslint/switch-exhaustiveness-check': 'off', // Switch incompletos

      // ==========================================
      // REGLAS TYPE-CHECKED DESACTIVADAS
      // ==========================================
      // Estas reglas son útiles pero muy estrictas o causan muchos falsos positivos
      '@typescript-eslint/no-unnecessary-type-assertion': 'off', // Type assertions redundantes
      '@typescript-eslint/require-await': 'off', // async sin await
      '@typescript-eslint/no-unsafe-assignment': 'off', // Demasiado estricta
      '@typescript-eslint/no-unsafe-member-access': 'off', // Demasiado estricta
      '@typescript-eslint/no-unsafe-call': 'off', // Demasiado estricta
      '@typescript-eslint/no-unsafe-return': 'off', // Demasiado estricta
      '@typescript-eslint/strict-boolean-expressions': 'off', // Demasiado estricta
    },
  },
]);
