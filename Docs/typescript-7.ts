/**
 * ============================================================================
 * TypeScript 7.0 — guía práctica para Artiefy
 * ============================================================================
 *
 * Fuentes verificadas (julio 2026):
 *  - https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
 *  - https://github.com/vercel/next.js/discussions/95633
 *  - https://github.com/vercel/next.js/pull/95639
 *  - https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview
 *
 * Estado de ESTE repo al escribir esto:
 *  - typescript 6.0.3
 *  - next 16.2.10
 *  - check gate: `eslint . --config eslint.cli.config.mjs && tsc --noEmit`
 *
 * Este archivo es documentación ejecutable: compila con TS 6 y con TS 7.
 * Todo lo que no compila en TS 7 está en comentarios, a propósito.
 */

export {};

/* ============================================================================
 * 1. QUÉ ES TS 7 (y qué NO es)
 * ==========================================================================*/

/**
 * TS 7 NO es una versión nueva del lenguaje. Es el MISMO compilador
 * reescrito en Go (proyecto "Corsa" / typescript-go). El chequeo de tipos
 * es prácticamente idéntico; lo que cambia es la máquina que lo ejecuta.
 *
 * Números reales publicados por el equipo (build completo):
 *   VS Code    125.7s → 10.6s   (11.9x)
 *   Sentry     139.8s → 15.7s   (8.9x)
 *   Bluesky     24.3s →  2.8s   (8.7x)
 *   Playwright  12.8s →  1.47s  (8.7x)
 *   tldraw      11.2s →  1.46s  (7.7x)
 *
 * Memoria: entre -6% y -26%. Abrir un archivo en el editor del repo de
 * VS Code pasó de ~17.5s a menos de 1.3s.
 *
 * El truco no es solo "Go es rápido": es memoria compartida y paralelismo
 * real. En Node el checker era single-thread. En Go se reparte por workers.
 */

/* ============================================================================
 * 2. FLAGS NUEVOS DE CLI (esto sí es nuevo, no existía en TS 6)
 * ==========================================================================*/

/**
 *   tsc --checkers 8        Workers de type-check. Default: 4.
 *                           Más workers = más rápido y más RAM.
 *                           Con --checkers 8 se reportan hasta 16.7x.
 *
 *   tsc --builders 4        Paraleliza builds de project references
 *                           (monorepos con `references` en tsconfig).
 *
 *   tsc --singleThreaded    Apaga todo el paralelismo. Para debug o CI
 *                           con poca RAM / contenedores limitados.
 *
 *   tsc --ignoreConfig      Necesario si pasás rutas de archivo por CLI
 *                           existiendo un tsconfig.json (ver §3).
 *
 * `--watch` se reescribió entero: portaron el file-watcher de Parcel a Go.
 * Es el cambio que más se nota en el día a día en Windows.
 */

/* ============================================================================
 * 3. DEFAULTS QUE CAMBIARON — leé esto antes de migrar
 * ==========================================================================*/

/**
 * Si tu tsconfig NO declara la opción, TS 7 asume:
 *
 *   strict                        → true   (antes false)
 *   module                        → esnext
 *   target                        → el ES estable anterior a esnext
 *   noUncheckedSideEffectImports  → true   (antes false)  ← OJO
 *   stableTypeOrdering            → true   y NO se puede desactivar
 *   rootDir                       → "./"
 *   types                         → []     (antes: todo @types/*)
 *
 * Los dos que muerden de verdad:
 *
 * a) `types: []` por default. Antes TS metía TODO lo que hubiera en
 *    node_modules/@types automáticamente. Ahora no mete nada salvo que
 *    lo listes. Nuestro tsconfig ya lo declara explícito:
 *      "types": ["@webgpu/types", "html2canvas"]
 *    Si algo global (node, jest) deja de existir, agregalo ahí.
 *
 * b) `noUncheckedSideEffectImports: true` por default. Un import de solo
 *    efecto secundario que no resuelva ahora es ERROR:
 *      import '~/styles/globals.css';
 *    Si el módulo no resuelve a nada tipado, revienta. En Artiefy hay
 *    imports de CSS, así que este es el candidato #1 a romper el build.
 */

/* ============================================================================
 * 4. SINTAXIS Y OPCIONES QUE YA NO EXISTEN (errores duros en TS 7)
 * ==========================================================================*/

/**
 * --- compilerOptions eliminadas / prohibidas ---------------------------
 *
 *   "target": "es5"                    ✗ error duro
 *   "downlevelIteration": true         ✗ eliminada
 *   "moduleResolution": "node"         ✗ usar "nodenext" o "bundler"
 *   "moduleResolution": "node10"       ✗ idem
 *   "moduleResolution": "classic"      ✗ eliminada
 *   "module": "amd" | "umd"            ✗ eliminados
 *   "module": "systemjs" | "none"      ✗ eliminados
 *   "baseUrl": "."                     ✗ eliminada (usar solo `paths`)
 *   "esModuleInterop": false           ✗ ya no se puede apagar
 *   "allowSyntheticDefaultImports": false  ✗ ya no se puede apagar
 *   "alwaysStrict": false              ✗ ya no se puede apagar
 *
 * Nuestro tsconfig.json ya está limpio en todo esto:
 *   target ES2020 ✓, moduleResolution "bundler" ✓, sin baseUrl ✓,
 *   esModuleInterop true ✓, strict true ✓.
 *
 * --- sintaxis del lenguaje eliminada ----------------------------------
 */

// ✗ NO COMPILA EN TS 7 — la palabra `module` en namespaces murió:
//
//     module Legacy {
//       export const x = 1;
//     }
//
// ✓ Forma válida en TS 7 (aunque deberías usar módulos ES igual):
//
//     namespace Legacy {
//       export const x = 1;
//     }

// ✗ NO COMPILA EN TS 7 — import attributes con `assert`:
//
//     import data from './data.json' assert { type: 'json' };
//
// ✓ Forma válida: `with`
//
//     import data from './data.json' with { type: 'json' };

// ✗ NO COMPILA EN TS 7 — /// <reference no-default-lib="true"/>
//    bajo `skipDefaultLibCheck`.

// ✗ NO COMPILA EN TS 7 — pasar rutas por CLI existiendo tsconfig.json:
//
//     tsc src/foo.ts        → error si hay tsconfig.json
//     tsc --ignoreConfig src/foo.ts   ✓

/* ============================================================================
 * 5. CAMBIO SEMÁNTICO REAL: template literal types + Unicode
 * ==========================================================================*/

/**
 * TS 6 partía los strings por unidades UTF-16 (surrogate pairs).
 * TS 7 los parte por code points reales.
 */

type HeadTail<S extends string> = S extends `${infer H}${infer T}`
  ? [H, T]
  : never;

// TS 6: ['\ud83d', '\ude00abc']   ← el emoji partido a la mitad
// TS 7: ['😀', 'abc']             ← correcto
export type EmojiSplit = HeadTail<'😀abc'>;

/**
 * Esto importa si tenés tipos que parsean rutas, slugs o IDs carácter
 * por carácter. En Artiefy no hay nada así hoy, pero si algún día hacés
 * un tipo de routing a nivel de tipos, ojo acá.
 */

/* ============================================================================
 * 6. JSDOC / ARCHIVOS .JS — lo que se rompe
 * ==========================================================================*/

/**
 * Se reescribió el análisis de JS para que sea consistente con TS.
 * Si tenés `allowJs: true` (nosotros SÍ lo tenemos), esto te toca:
 *
 *   1. Un VALOR ya no sirve como tipo. Usá `typeof valor`.
 *   2. `@enum` eliminado. Reemplazo:
 *        @typedef {(typeof MiEnum)[keyof typeof MiEnum]} MiEnum
 *   3. `?` suelto ya no es un tipo válido. Usá `any`.
 *   4. `@class` ya no convierte una function en constructor.
 *      Usá `class` de verdad.
 *   5. El `!` postfijo (non-null assertion) no existe en JSDoc.
 *   6. Los nombres de tipo tienen que estar dentro de un `@typedef`.
 *   7. Sintaxis Closure `function(string): void` eliminada.
 *      Usá `(arg: string) => void`.
 */

/* ============================================================================
 * 7. EL PROBLEMA GORDO: TS 7.0 NO TIENE API PROGRAMÁTICA
 * ==========================================================================*/

/**
 * TS 7.0 es un BINARIO nativo. El paquete ya no trae `lib/typescript.js`.
 * Es decir: NO existe `require('typescript')`.
 *
 * Todo lo que dependía de esa API está fuera de juego hasta TS 7.1:
 *
 *   ✗ typescript-eslint          ← lo usamos en el check gate
 *   ✗ ts-loader / webpack loaders
 *   ✗ Vue, Svelte, Astro, MDX, Angular templates
 *   ✗ Next.js (su detección busca lib/typescript.js)
 *
 * El equipo dijo explícitamente: "TypeScript 7.1 shipeará con una API
 * nueva (y distinta)". Hasta entonces, la estrategia oficial es CONVIVIR:
 * TS 7 para el CLI (rápido), TS 6 para editor y herramientas.
 */

/* ============================================================================
 * 8. CONFIGURACIÓN RECOMENDADA PARA ARTIEFY (convivencia 6 + 7)
 * ==========================================================================*/

/**
 * ── Paso 1: instalar los dos en package.json ─────────────────────────
 *
 *   {
 *     "devDependencies": {
 *       "typescript": "npm:@typescript/typescript6@^6.0.2",
 *       "@typescript/native": "npm:typescript@^7.0.2"
 *     }
 *   }
 *
 * Qué queda:
 *   - `typescript` → sigue siendo el TS 6 con API JS.
 *     Lo consumen typescript-eslint, Next.js y el editor. Nada se rompe.
 *     El paquete de compat expone además el binario `tsc6`.
 *   - `@typescript/native` → el binario Go de TS 7. Ejecutable `tsgo`.
 *
 * ── Paso 2: scripts ──────────────────────────────────────────────────
 *
 *   "typecheck":      "tsgo --noEmit"                 ← rápido, TS 7
 *   "typecheck:slow": "tsc --noEmit"                  ← TS 6, fallback
 *   "check":          "eslint . --config eslint.cli.config.mjs
 *                      --max-warnings=0 && tsgo --noEmit"
 *
 * ESLint sigue con TS 6 (obligado). El typecheck pasa a TS 7.
 * Ganancia medida por otros en proyectos similares: ~900ms → ~300ms.
 * Slack bajó su type-check de CI de 7.5 min a 1.25 min.
 *
 * ── Paso 3: Next.js ──────────────────────────────────────────────────
 *
 * next 16.2.10 (el que tenemos) SOLO reconoce el paquete viejo
 * `@typescript/native-preview`. Lo verifiqué en:
 *   node_modules/next/dist/lib/verify-typescript-setup.js
 * → función `hasNativeTypeScriptPreview()`.
 *
 * Con `typescript@7` a secas, Next tira "package not installed" porque
 * busca lib/typescript.js. El fix es el PR vercel/next.js#95639, que
 * agrega el flag experimental:
 *
 *   // next.config.mjs
 *   const nextConfig = {
 *     experimental: {
 *       useTypeScriptCli: true, // corre tu `tsc` local en next build
 *     },
 *   };
 *
 * Requiere un `next@canary` que incluya ese PR. En 16.2.10 NO está.
 * Mientras tanto: no toques next.config.mjs y dejá que Next use el
 * `typescript` aliaseado a TS 6 (Paso 1). Funciona sin flags.
 *
 * ── Paso 4: ajustes de tsconfig.json ─────────────────────────────────
 *
 * Nuestro tsconfig ya es compatible. Solo dos cosas a vigilar cuando
 * corras `tsgo --noEmit` la primera vez:
 *
 *   1. `noUncheckedSideEffectImports` ahora es true por default.
 *      Si los imports de CSS revientan, agregá explícitamente:
 *        "noUncheckedSideEffectImports": false
 *      (se puede apagar; no es de las prohibidas)
 *
 *   2. `types: ["@webgpu/types", "html2canvas"]` ya está explícito ✓
 *      pero si falta algo global (ej. "node"), agregalo ahí — el
 *      auto-include de @types murió.
 */

/* ============================================================================
 * 9. VS CODE — configuración global (tu máquina, todos los proyectos)
 * ==========================================================================*/

/**
 * ── Paso 1: instalar la extensión ────────────────────────────────────
 *
 *   Extensión: "TypeScript 7"  (también listada como Native Preview)
 *   ID:        TypeScriptTeam.native-preview
 *
 *   Command Palette → Extensions: Install Extensions → pegá el ID.
 *   O:  code --install-extension TypeScriptTeam.native-preview
 *
 * ── Paso 2: activarla ────────────────────────────────────────────────
 *
 *   Command Palette (Ctrl+Shift+P) → "TypeScript: Enable TypeScript 7"
 *
 * Una vez activada pasa a ser el language server por defecto, y hay un
 * comando en la paleta para volver a 6.0 si algo se rompe.
 *
 * ── Paso 3: settings globales (Ctrl+Shift+P → "Preferences: Open User
 *    Settings (JSON)"  →  %APPDATA%\Code\User\settings.json) ──────────
 *
 *   {
 *     "js/ts.experimental.useTsgo": true,
 *     "js/ts.tsdk.path": ""
 *   }
 *
 *   `js/ts.tsdk.path` apunta al directorio de un paquete TypeScript
 *   local si querés forzar una versión concreta. Vacío = la que trae
 *   la extensión.
 *
 * ── Paso 4: excepción por workspace ──────────────────────────────────
 *
 * OJO: Vue/Svelte/Astro/MDX/Angular NO funcionan con TS 7 todavía.
 * En esos repos, apagalo solo ahí en .vscode/settings.json:
 *
 *   { "js/ts.experimental.useTsgo": false }
 *
 * En Artiefy (React + Next puro) no hace falta apagarlo.
 */

/* ============================================================================
 * 10. RESUMEN EJECUTIVO
 * ==========================================================================*/

interface MigrationStep {
  readonly step: string;
  readonly blocked: boolean;
  readonly reason?: string;
}

export const ARTIEFY_TS7_PLAN: readonly MigrationStep[] = [
  {
    step: 'VS Code global: extensión TypeScriptTeam.native-preview',
    blocked: false,
  },
  {
    step: 'Alias package.json: typescript@6 + @typescript/native@7',
    blocked: false,
  },
  {
    step: 'Script typecheck → tsgo --noEmit',
    blocked: false,
  },
  {
    step: 'ESLint sobre TS 7',
    blocked: true,
    reason: 'typescript-eslint necesita la API JS; llega en TS 7.1',
  },
  {
    step: 'next build con experimental.useTypeScriptCli',
    blocked: true,
    reason: 'PR #95639 no está en next 16.2.10; requiere canary',
  },
];

/**
 * Regla de oro: TS 7 hoy es un ACELERADOR DEL CLI, no un reemplazo total
 * del toolchain. Editor y typecheck ✓. ESLint y build de Next, todavía
 * no. Eso se destraba con 7.1.
 */
