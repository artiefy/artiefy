## Project Structure & Module Organization

- **⚠️ IDIOMA OBLIGATORIO**: Responde SIEMPRE en español. No usar inglés bajo ninguna circunstancia.
- `src/app/` hosts the Next.js App Router routes, layouts, and pages.
- `src/components/`, `src/hooks/`, `src/lib/`, `src/utils/`, and `src/server/` hold shared UI, hooks, helpers, and server-side logic.
- `public/` and `videos/` contain static assets and media served by the app.
- `drizzle/` defines database schema/config; `migrations/` stores generated migration files.
- `scripts/` contains one-off automation such as `scripts/regen-embeddings.ts`.
- `test/` is reserved for test files (currently minimal).

## Build, Test, and Development Commands

- `npm run dev`: start the Next.js dev server.
- `npm run build`: create a production build (`next build --debug-prerender`).
- `npm run start`: run the production server from the build output.
- `npm run preview`: build and immediately start the production server.
- `npm run lint` / `npm run lint:fix`: run ESLint (or auto-fix) with `eslint.cli.config.mjs`.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run check`: run lint + typecheck together.
- `npm run format:check` / `npm run format:write`: verify or apply Prettier formatting.
- `npm run db:generate`, `db:migrate`, `db:push`, `db:studio`: Drizzle schema and migration workflows.

## Coding Style & Naming Conventions

- Indentation is 2 spaces with LF line endings and an 80-char print width (`.editorconfig`, `prettier.config.mjs`).
- Use `~/*` import aliases for `src/*` (see `tsconfig.json`).
- Keep React components in PascalCase files (follow existing patterns in `src/components/`).
- Run Prettier + ESLint before committing; lint-staged enforces this for staged files.

## Testing Guidelines

- No dedicated test runner is wired in `package.json`; rely on `npm run check` for CI-grade lint/type checks.
- Place any future tests under `test/` and document the runner when introduced.

## Commit & Pull Request Guidelines

- Follow conventional commits as configured in `git-conventional-commits.yaml` (e.g., `feat`, `fix`, `perf`, `docs`).
- Example format: `feat(auth): add OAuth callback`.
- Husky hooks run `lint-staged` on pre-commit and `npm run typecheck` on pre-push.
- PRs should include a short summary, linked issues, and screenshots for UI changes.

## Configuration & Environment

- Store local secrets in `.env` and keep `.env.production` for deployment references.
- Validate and access environment variables through `src/env.ts`.

## Context7 MCP - Documentación Oficial (Codex GPT / Claude Code)

**Regla automática para Codex GPT y Claude Code**: Siempre usa **Context7 MCP** para obtener documentación oficial actualizada de librerías sin necesidad de escribir "use context7" en cada prompt.

### Instalación en Claude Code

1. **Instalar MCP Server:**

```bash
claude mcp add --scope user \
  --header "CONTEXT7_API_KEY: YOUR_API_KEY" \
  --transport http context7 \
  https://mcp.context7.com/mcp
```

2. **Instalar Plugin Marketplace:**

```
/plugin marketplace add upstash/context7
/plugin install context7-plugin@context7-marketplace
```

### Tip 1: Add a Rule (Agregar Regla Automática)

Para activar Context7 automáticamente en Codex GPT / Claude Code:

**En `CLAUDE.md` (raíz del proyecto):**

```txt
Always use Context7 MCP when I need library/API documentation, code
generation, setup or configuration steps without me having to explicitly ask.
```

### Tip 2: Use Library ID (Usar ID de Librería)

Incluye el ID de Context7 para resolver la librería rápidamente:

**Con ID (más rápido):**

```
/context7:docs /vercel/next.js server actions typescript
/context7:docs /drizzle-team/drizzle-orm postgres neon pooling
/context7:docs /clerk/clerk-js authentication patterns
```

**Sin ID (auto-resolución):**

```
/context7:docs react hooks documentation
/context7:docs drizzle relationships
```

### Tip 3: Specify a Version (Especificar Versión)

Menciona la versión en tu prompt y Context7 resolverá la documentación correcta:

**Ejemplos:**

```
/context7:docs /vercel/next.js 16 server actions with typescript
/context7:docs /drizzle-team/drizzle-orm 0.45 neon postgres pooling
show me clerk v6 authentication patterns
Configure Tailwind CSS 4.2 utilities
```

Context7 automáticamente detectará y buscará la versión específica.

### Características del Plugin

- **Skills**: Auto-detecta cuándo necesitas documentación de librerías
- **Agents**: `docs-researcher` para búsquedas dedicadas sin contaminar contexto
- **Commands**: `/context7:docs <library> [query]` para búsquedas manuales

### Agentes disponibles

```
spawn docs-researcher to look up React documentation
spawn docs-researcher: how do I configure Drizzle with PostgreSQL?
```

### IDs útiles para este proyecto

- `/vercel/next.js` - Next.js 16 (App Router, Server Actions)
- `/drizzle-team/drizzle-orm` - Drizzle ORM v0.45 (Neon PostgreSQL)
- `/clerk/clerk-js` - Clerk v6 (Authentication, OAuth)
- `/tailwindlabs/tailwindcss` - Tailwind CSS 4.2 (Utilities, Design System)
- `/facebook/react` - React 19 (Hooks, Components)
- `/microsoft/typescript` - TypeScript 5.9 (Type Safety)
- `/openai/openai-node` - OpenAI API (Embeddings, Chat)
- `/aws-sdk/aws-sdk-js` - AWS SDK v3 (S3 Uploads)

### Índice completo de librerías

https://context7.com/docs/llms.txt
