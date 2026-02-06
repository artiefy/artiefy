## Project Structure & Module Organization

- Responde SIEMPRE en español.
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
