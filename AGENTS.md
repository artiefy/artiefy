# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Objetivo del agente

Mantener y evolucionar esta app (backend + frontend) usando:

- Next.js 16 App Router
- @t3-oss/env-nextjs (env.t3.gg)
- Clerk
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Neon PostgreSQL
- AWS S3
- Upstash
- Vercel
- npm
- TypeScript, ESLint, Prettier, EditorConfig
- Husky + lint-staged

## Reglas de trabajo continuo

1. Antes de cambiar código, detectar tecnologías impactadas en el prompt.
2. Consultar skills y MCP de esas tecnologías antes de implementar.
   2.1 Para configuración de variables de entorno, usar siempre `@t3-oss/env-nextjs` + `zod` en `src/env.ts`.
3. Preservar arquitectura y convenciones del proyecto salvo petición explícita de refactor.
4. Hacer cambios incrementales y mantener la app ejecutable en cada iteración.
5. Ejecutar validaciones completas (`lint`, `typecheck`, `build`) solo tras cambios importantes (multiarchivo, cambios estructurales, refactors, dependencias, lógica crítica o before-merge). En cambios pequeños y acotados (por ejemplo 1 archivo/UI puntual), no correr `lint` y `typecheck` completos por defecto.

## Skills locales disponibles

Ruta: `.agents/skills`

- `web-app-creator` (orquesta stack completo)
- `nextjs-app-router-patterns`
- `clerk-nextjs-patterns`
- `tailwind-design-system`
- `shadcn`
- `neon-postgres`
- `drizzle-orm`
- `aws-s3`
- `upstash`
- `frontend-skill`
- `security-best-practices`
- `playwright`
- `vercel-deploy`
- `find-skills`

## Política de invocación de skills

- Preferir invocación explícita en prompts críticos:
  - `$web-app-creator`
  - `$nextjs-app-router-patterns`
  - `$clerk-nextjs-patterns`
  - `$shadcn`
  - `$neon-postgres`
  - `$drizzle-orm`
  - `$aws-s3`
  - `$upstash`
- Para tareas generales, permitir invocación implícita por `description`.

## MCP que se deben usar por tecnología

- Next.js: `next_devtools` + documentación oficial
- env.t3.gg: documentación oficial en `https://env.t3.gg/docs/nextjs`
- Clerk: `mcp__clerk__*`
- shadcn/ui: `mcp__shadcn__*`
- Neon/Postgres: `mcp__neon__*`
- Drizzle ORM: docs oficiales en `https://orm.drizzle.team/docs/overview` + context7
- AWS S3: docs SDK v3 en `https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/` + context7
- Upstash: docs oficiales en `https://upstash.com/docs/redis/overall/getstarted` + context7
- Documentación web: primero docs oficiales/primarias de cada tecnología
- `context7`: usar como acelerador para ubicar secciones y ejemplos oficiales
- Búsqueda web: restringir a dominios oficiales cuando sea posible

## Política de versiones

- Confirmar versiones estables actuales antes de upgrades mayores.
- Si se actualiza Next.js, revisar también la guía oficial de env.t3.gg para Next.js y ajustar `src/env.ts` si cambia la integración recomendada.
- No asumir versiones si no hay fuente confiable.
- Documentar decisiones en `README.md` cuando afecten setup/infra.

## Definición de listo

Para cambios grandes (varios archivos o impacto alto):

- Código compila
- `npm run lint` pasa
- `npm run typecheck` pasa
- `npm run build` pasa (si aplica al cambio)

Para cambios pequeños (acotados):

- El cambio funciona y no rompe el flujo afectado
- Ejecutar validación puntual solo si aporta señal (sin requerir `lint`/`typecheck` completos en cada solicitud)
