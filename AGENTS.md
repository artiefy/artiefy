<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Repository Agent Instructions

How AI coding agents must work in this repository. The user describes changes in plain natural language; the agent infers the workflow, keeps token usage minimal, and protects the repo.

## Core Rules

Shared agent rules — work modes (DIRECT / SDD CONTROLLED / SDD STRICT), token budget, language contract, commits and integrity, Engram scope, GGA, and safety — live in the user-level global `~/.claude/CLAUDE.md` under "Shared Repo Rules — Next.js Projects (DEV)" and apply here without repetition. Repo-specific deltas:

- UI copy is Spanish-first and not wired to next-intl — keep copy consistent with nearby UI; never translate existing Spanish UI to English or introduce an i18n layer unless the feature requires it.
- Extra SDD STRICT triggers: payments (PayU), uploads (S3), integrations (n8n, OpenAI, Socket.IO, WhatsApp, Teams, ESP32).
- Check gate: `npm run check` (ESLint + tsc); central lint config `eslint.cli.config.mjs`; Husky runs lint-staged on commit and `npm run check` on push.
- Be especially careful with PayU payments, roles/permissions, and personal data; prefer reversible changes.

## Skills

Skills live in `.agents/skills/` (source of truth; `skills-lock.json` is the install record). Before an action matching a domain below, read only the most specific relevant `SKILL.md`. At most one skill for small changes; never for tiny copy/style edits.

| Domain               | Skills                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js / App Router | `next-best-practices`, `next-cache-components`, `next-upgrade`                                                                                                                                                                                                                                                                                                                                |
| React                | `react-best-practices`, `react-web` (hooks/client state), `react-expert` (official React behavior research), `react-modernization` (upgrades/migrations), `composition-patterns`, `frontend-code-review`                                                                                                                                                                                      |
| UI / design          | `frontend-design`, `web-design-guidelines`, `responsive-design`, `responsive-web-design`, `compatibility-testing`, `accessibility`                                                                                                                                                                                                                                                            |
| Styling              | `tailwind-css-patterns`, `tailwind-v4-shadcn`, `shadcn`                                                                                                                                                                                                                                                                                                                                       |
| Auth (Clerk)         | `clerk`, `clerk-setup`, `clerk-nextjs-patterns`, `clerk-react-patterns`, `clerk-custom-ui`, `clerk-orgs`, `clerk-backend-api`, `clerk-webhooks`, `clerk-testing`                                                                                                                                                                                                                              |
| Database / cache     | `drizzle`, `neon-postgres`, `redis-js` (Upstash Redis, rate limiting, sessions)                                                                                                                                                                                                                                                                                                               |
| Backend / Node       | `nodejs-backend-patterns`, `nodejs-best-practices`, `zod`, `typescript-advanced-types`, `bash-defensive-patterns`                                                                                                                                                                                                                                                                             |
| SEO                  | `seo`, `seo-audit` (technical diagnosis, rankings/CWV issues)                                                                                                                                                                                                                                                                                                                                 |
| Docs / integrations  | `context7-mcp`, `context7-cli`, `n8n-workflow-patterns`, `mcp-server-patterns`, `deploy-to-vercel`, `playwright-dev` (developing Playwright itself)                                                                                                                                                                                                                                           |
| Files / PDF          | `xlsx` (.xlsx/.csv as primary I/O), `react-pdf` (`@react-pdf/renderer`)                                                                                                                                                                                                                                                                                                                       |
| HyperFrames video    | `hyperframes` (compositions), `hyperframes-cli`, `hyperframes-media` (TTS/transcription/captions), `hyperframes-registry`, `remotion-to-hyperframes`, `website-to-hyperframes`, `contribute-catalog`; motion inside compositions: `gsap`, `animejs`, `css-animations`, `waapi`, `lottie`, `tailwind` (HyperFrames runtime Tailwind), `three` (WebGL in compositions), `typegpu` (WebGPU/WGSL) |
| Three.js (app)       | `threejs-fundamentals`, `threejs-animation`, `threejs-geometry`, `threejs-interaction`, `threejs-lighting`, `threejs-loaders`, `threejs-materials`, `threejs-postprocessing`, `threejs-shaders`, `threejs-textures` — load only the specific sub-skill                                                                                                                                        |
| Skill tooling        | `skill-creator`, `skill-installer`, `agents-md-maintainer`                                                                                                                                                                                                                                                                                                                                    |

Sync rule: keep this list aligned with the actual directories in `.agents/skills/`. Read a new skill's `SKILL.md` before documenting it; if its trigger is unclear, write `PENDING: review trigger for <skill>`.

## Project Overview — Artiefy

Production education platform (Next.js 16 App Router). Fixed stack — never introduce another framework, database, ORM, auth provider, styling system, package manager, or deployment platform unless explicitly requested.

| Area               | Location                                                    | Stack                                                                                                      |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| App Router         | `src/app/`                                                  | Next.js 16, React 19, Server Components                                                                    |
| API routes         | `src/app/api/`                                              | Route Handlers                                                                                             |
| Dashboards         | `src/app/dashboard/`                                        | Behind Clerk auth + role-based access                                                                      |
| Student pages      | `src/app/estudiantes/`                                      | Spanish-first UI                                                                                           |
| Components / hooks | `src/components/`, `src/hooks/`                             | React 19, Tailwind CSS 4, shadcn/Radix, Mantine, Headless UI                                               |
| Server code        | `src/server/`, `src/server/actions/`, `src/server/queries/` | Server-only logic lives here or in route handlers                                                          |
| Database           | `src/server/db/`, `drizzle/`, `migrations/`                 | Drizzle ORM + Neon PostgreSQL                                                                              |
| Env                | `src/env.ts`                                                | `@t3-oss/env-nextjs` + Zod                                                                                 |
| Styles             | `src/styles/globals.css`, `src/styles/*.css`                | Tailwind CSS 4                                                                                             |
| Media / video      | `videos/`, next-video, Mux player                           | Plaiceholder for image placeholders                                                                        |
| Integrations       | existing helpers/routes                                     | AWS S3, PayU payments, n8n, OpenAI, Upstash Redis, Socket.IO, ESP32, Microsoft Teams, WhatsApp, nodemailer |
| Tooling            | root configs                                                | ESLint 10, Prettier, Husky + lint-staged (npm 11.x, Node 24.x)                                             |

Repo-specific rules:

- Absolute imports via `~/` (NOT `@/`) unless importing from the same directory.
- Dynamic routes use normal params (`[id]`, `[courseId]`) and catch-all Clerk auth routes; do NOT add locale routing.
- Preserve existing role checks for `super-admin`, `admin`, `educadores`, and students.
- For S3, PayU, n8n, OpenAI, Upstash, ESP32, Socket.IO, and Teams work: follow the existing helpers and route patterns before adding new integration code.
- Formatting: 2 spaces, LF, semicolons, single quotes, 80-char print width; Prettier sorts Tailwind classes.
- No unnecessary `useEffect`; no `useMemo`/`useCallback` without a measured reason; use `React.ReactNode`.
- Validate server env vars through `src/env.ts`; no direct `process.env` in new code except existing bootstrap patterns or `NEXT_PUBLIC_*` client-side.

## Commands

Verified scripts (`npm run`) — do not invent or rename:

```bash
npm run dev / build / start / preview     # build uses --debug-prerender
npm run check          # eslint (cli config, --max-warnings=0) + tsc
npm run lint / lint:fix
npm run typecheck
npm run format:check / format:write
npm run db:generate / db:migrate / db:push / db:studio
npm run embeddings:regen
npm run setup:hooks
```

Validation policy: do NOT run `build`, `check`, `lint`, or `typecheck` by default. For small changes, prefer targeted inspection and manually verifying the affected route or API. Run heavy validations only when the user asks, or the change touches build config, dependencies, schema/migrations, auth/roles, payments, or critical data flows — and say which command and why before running it. `db:*` and `embeddings:regen` require explicit user approval. No test runner is configured; `check`/`lint`/`typecheck` are the baseline verification when verification is warranted. Husky runs lint-staged on commit and `npm run check` on push.

## Database, Auth, and Integration Safety

- Drizzle schema/migrations only via `drizzle-kit` scripts; incremental, reviewable changes; explain impact before schema changes; never destructive operations or `db:push` without explicit approval.
- Clerk: keep role/permission checks server-side; verify protected routes and fallbacks before closing auth changes.
- Payments (PayU), S3, Redis, OpenAI, WhatsApp, and database changes: verify environment variables and failure behavior before closing.

## Model Routing

Plan expensive, execute cheap. For medium/large changes (several files, new behavior, architecture, DB/auth): do the analysis and a written implementation plan with the strongest available model (Opus-class), hand implementation to a cheaper model (Sonnet-class; Haiku-class for mechanical edits), then review the diff against the plan on the strong model. Plans for a cheaper executor must be self-contained: exact file paths, current-state code excerpts, this repo's check-gate commands as verification steps, an explicit out-of-scope list, and STOP conditions. Tiny one-file changes skip the split — plan/delegate overhead costs more than it saves.

## Integrated Browser

When a change affects visible UI, when debugging layout/hydration/console errors, or when the user asks, verify it in the agent's own integrated browser against the local dev server — `npm run dev`, default `http://localhost:3000` — instead of asking the user for screenshots. Integrated browser means the browser built into the agent's native app: Claude Code Browser pane (`mcp__Claude_Browser__*` tools), Codex app browser. NEVER use the Playwright MCP, chrome-devtools MCP, `playwright-cli`, or anything that opens an external Google Chrome window for this — those are only for explicit Playwright/E2E test requests. Reuse a running dev server; never start a second instance on another port without saying so. Skip for logic-only changes with no visual surface.

## Installed Plugins / Extensions

Use the tooling already installed instead of reinventing it or giving a generic answer. In Claude Code these are plugins (skills, agents, slash commands, MCP servers, hooks); in Codex they are complementos/extensiones. Before doing a task by hand, check whether an installed plugin/complemento already covers it — a dedicated MCP for a service, a domain skill, a review agent, a workflow command — and prefer the most specific installed tool. Do not install new ones or enable disabled ones on your own; only use what is installed, and if a clearly-relevant one is missing, say so and let the user decide.
