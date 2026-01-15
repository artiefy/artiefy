# AGENTS.md

## Contexto del proyecto

- Artiefy es una plataforma educativa con Next.js 16, TypeScript y TailwindCSS.
- App router en `src/app/`; componentes en `src/components/`; estilos en `src/styles/`.
- Rutas por rol: `super-admin`, `admin`, `educadores`, `estudiantes`.

## Reglas de desarrollo

- Responde siempre en español.
- Server Components por defecto; usa `'use client'` solo cuando sea imprescindible.
- Datos: prioriza Server Actions o Route Handlers; en cliente usa SWR según `Docs/doc-nextjs16/guia-swr-nextjs.md`. No uses `fetch` directo en cliente fuera de SWR.
- Caché y APIs de Next.js 16: sigue las guías en `Docs/doc-nextjs16/` y menciona la sección aplicada cuando corresponda.
- Variables de entorno: añade nuevas vars en `src/env.ts` (Zod + `runtimeEnv`) y usa `env` en `next.config.*`.
- Calidad: cuando aplique, corre `npm run lint`, `npm run format:write` y `npm run typecheck`.

## Base de datos

- Drizzle + Neon. Genera/aplica migraciones con `npm run db:generate` y `npm run db:migrate`.

## Skills Codex

- Usa las skills de `.codex/skills` cuando la tarea coincida (Next.js, DB, Clerk, UI, IA).
