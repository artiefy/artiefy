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
   2.2 Mantener stack fijo del proyecto: no proponer ni introducir migraciones a otros frameworks (Vue/Angular/Svelte/Laravel/Django/Rails, etc.) salvo pedido explícito del usuario.
3. Preservar arquitectura y convenciones del proyecto salvo petición explícita de refactor.
4. Hacer cambios incrementales y mantener la app ejecutable en cada iteración.
5. Ejecutar validaciones completas (`lint`, `typecheck`, `build`) solo tras cambios importantes (multiarchivo, cambios estructurales, refactors, dependencias, lógica crítica o before-merge). En cambios pequeños y acotados (por ejemplo 1 archivo/UI puntual), no correr `lint` y `typecheck` completos por defecto.
6. Si un skill general incluye ejemplos de otras tecnologías, tratarlos solo como referencia metodológica; la implementación final debe quedar en el stack objetivo de este proyecto.

## Modo no técnico (prompt simple)

- Aceptar prompts de negocio sin jerga técnica (ejemplo: "quiero crear una app para mi negocio de...").
- Traducir automáticamente objetivos de negocio a tareas técnicas del stack definido.
- Si faltan detalles funcionales importantes, asumir defaults razonables y avanzar en incremental, documentando supuestos en la respuesta final.
- No exigir al usuario invocar skills manualmente para tareas comunes; priorizar lenguaje natural.

## Política de subagentes

- Por defecto, resolver con agente principal + `AGENTS.md` + skills.
- Usar subagentes solo cuando el usuario lo pida explícitamente o el trabajo sea claramente paralelizable y de alto volumen (auditorías por categorías, exploración masiva, lotes similares).
- Evitar subagentes para cambios pequeños o lineales (1 feature acotada, 1-3 archivos, ajustes UI puntuales).
- Si se usan subagentes, definir alcance por rol (seguridad/tests/mantenibilidad), esperar resultados y devolver consolidado con archivos afectados.

## Seguridad operativa mínima

- Nunca exponer secretos en respuestas, logs o commits.
- Mantener `.env*` ignorado por git; usar `.env.example` solo como plantilla sin valores reales.
- Antes de cerrar cambios de auth/roles/permisos, validar rutas protegidas, checks de rol y fallbacks de acceso denegado.
- En cambios con riesgo de datos (DB/migraciones), priorizar estrategia segura e incremental y advertir impacto antes de ejecutar pasos destructivos.

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
- `nextjs-seo`
- `nextjs-seo-optimizer`
- `competitive-analysis`
- `content-scoring`
- `schema-generator`
- `validation-doctor`
- `source-driven-development` (validación contra documentación oficial con citas)
- `spec-driven-development` (especificación previa para features no triviales)
- `api-and-interface-design`
- `planning-and-task-breakdown`
- `incremental-implementation`
- `test-driven-development`
- `code-review-and-quality`
- `debugging-and-error-recovery`
- `performance-optimization`
- `security-and-hardening`
- `frontend-ui-engineering`
- `documentation-and-adrs`
- `shipping-and-launch`
- `ci-cd-and-automation`
- `context-engineering`

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
  - `$nextjs-seo`
  - `$nextjs-seo-optimizer`
  - `$competitive-analysis`
  - `$content-scoring`
  - `$schema-generator`
  - `$validation-doctor`
  - `$source-driven-development`
  - `$spec-driven-development`
  - `$api-and-interface-design`
  - `$planning-and-task-breakdown`
  - `$incremental-implementation`
  - `$test-driven-development`
  - `$code-review-and-quality`
  - `$debugging-and-error-recovery`
  - `$performance-optimization`
  - `$security-and-hardening`
  - `$frontend-ui-engineering`
  - `$documentation-and-adrs`
  - `$shipping-and-launch`
  - `$ci-cd-and-automation`
  - `$context-engineering`
- Para tareas generales, permitir invocación implícita por `description`.
- Para features SaaS no triviales, usar por defecto este orden:
  1. `spec-driven-development` para convertir requerimientos en criterios claros.
  2. `web-app-creator` para implementar incrementalmente en el stack del proyecto.
  3. `source-driven-development` para validar decisiones de framework con fuentes oficiales y citar.
- Para evolución continua de SaaS con prompts normales, aplicar flujo adaptativo:
  1. Descubrimiento/alcance: `context-engineering` + `spec-driven-development`.
  2. Diseño técnico: `api-and-interface-design` + `planning-and-task-breakdown`.
  3. Implementación incremental: `incremental-implementation` + `web-app-creator` + `frontend-ui-engineering` (si aplica UI).
  4. Calidad: `test-driven-development` + `code-review-and-quality` + `debugging-and-error-recovery` (si hay fallos).
  5. Endurecimiento y performance: `security-and-hardening` + `performance-optimization`.
  6. Documentación y salida: `documentation-and-adrs`, luego `shipping-and-launch` y `ci-cd-and-automation` cuando aplique release.
- Para solicitudes SEO, aplicar por defecto este flujo:
  1. `nextjs-seo` para arquitectura SEO en App Router (metadata, sitemap, robots, canonical, OG).
  2. `nextjs-seo-optimizer` para optimización on-page técnica y de contenido.
  3. `content-scoring` y `competitive-analysis` para priorización basada en oportunidades.
  4. `schema-generator` para JSON-LD.
  5. `validation-doctor` para validar dependencias/herramientas de verificación cuando aplique.

## MCP que se deben usar por tecnología

- Next.js: `next_devtools` + documentación oficial
- env.t3.gg: documentación oficial en `https://env.t3.gg/docs/nextjs`
- Clerk: `mcp__clerk__*`
- shadcn/ui: `mcp__shadcn__*`
- Neon/Postgres: `mcp__neon__*`
- Drizzle ORM: docs oficiales en `https://orm.drizzle.team/docs/overview` + context7
- AWS S3: docs SDK v3 en `https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/` + context7
- Upstash: docs oficiales en `https://upstash.com/docs/redis/overall/getstarted` + context7
- SEO Next.js: documentación oficial de metadata/sitemap/robots de Next.js (`https://nextjs.org/docs/app/getting-started/metadata-and-og-images` y `https://nextjs.org/docs/app/api-reference/file-conventions`)
- SEO técnico: documentación primaria de Google Search Central (`https://developers.google.com/search/docs`)
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
