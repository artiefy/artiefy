# Instrucciones para agentes AI (Artiefy)

- Responde SIEMPRE en español.
- Stack principal: Next.js 16 (App Router) + React 19 + TypeScript. Configuración clave en `next.config.mjs` (typedRoutes, next-video, plaiceholder, imágenes remotas).
- Arquitectura: rutas en `src/app/*`, handlers en `src/app/api/**/route.ts`, componentes compartidos en `src/components`, lógica de servidor en `src/server/**`.
- Acceso a datos: Drizzle + Neon. Conexión en `src/server/db/index.ts`, esquema único en `src/server/db/schema.ts` (tablas de cursos, proyectos, chat n8n, etc.).
- Acciones/queries de servidor usan `'use server'` en `src/server/actions/**` y `src/server/queries/**` (ver `createProject.ts` para patrón de validar usuario Clerk y crear registros).
- Auth y roles: Clerk. El control de acceso por rol se hace en `src/proxy.ts` (admin/super-admin/educador) y el proveedor global está en `src/app/layout.tsx`.
- Variables de entorno validadas con `@t3-oss/env-nextjs` en `src/env.ts`; importa `env` desde `~/env` en server code.
- Integraciones clave:
  - OpenAI: handler en `src/app/api/openai-assistant/route.ts` (Chat Completions + fallback Responses, tool para WhatsApp).
  - Cron: rutas en `src/app/api/cron/**` requieren `Authorization: Bearer ${CRON_SECRET}` (ver `check-subscriptions/route.ts`).
  - Imágenes S3: proxy/optimización en `src/app/api/image-proxy/route.ts` y `remotePatterns` en `next.config.mjs`.
  - n8n: variables `N8N_*` en `src/env.ts` y rutas bajo `src/app/api/n8n-direct/**`.
- Convenciones: alias de imports `~/*` (ver `tsconfig.json`), RSC por defecto y componentes cliente con `'use client'` solo cuando hay estado/efectos.
- Metadatos/SEO: `generateMetadata` y schema.org en `src/app/layout.tsx` y utilidades en `src/lib/metadata/**`.

## Flujos de trabajo

- Dev: `npm run dev`
- Build/preview: `npm run build` / `npm run preview`
- Lint/TS: `npm run lint`, `npm run typecheck`, `npm run check`
- DB (Drizzle): `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`
- Embeddings: `npm run embeddings:regen` (usa `scripts/regen-embeddings.ts`)

## Notas de implementación

- Para cambios en DB, edita `src/server/db/schema.ts` y usa los scripts de Drizzle.
- Para rutas protegidas, respeta las reglas de `src/proxy.ts` y los roles en Clerk.
