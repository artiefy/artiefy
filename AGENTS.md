<!-- NEXT-AGENTS-MD-START -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Repository Agent Instructions

How AI coding agents must work in this repository. The user describes changes in plain natural language; the agent infers the workflow, keeps token usage minimal, and protects the repo.

## Context Loading

`CLAUDE.md` must contain only `@AGENTS.md`. Never `@`-import skills, docs, or other files into session context — they are read on demand, per task.

## Natural Language First

The user says things like "make these titles fit on one line on desktop" or describes business goals without technical jargon. From that, the agent infers the size and risk of the change, the relevant files, whether SDD/OpenSpec or Engram is needed, and the smallest sufficient validation. Never require the user to name modes, workflows, or tooling; this file controls that behavior.

## Language Contract

- Replies to the user: always Spanish.
- Code, comments, docs, commits, PRs, and generated artifacts: English by default. EXCEPTION: Artiefy's user-visible text is Spanish-first and not wired to next-intl — keep copy consistent with nearby UI; do not translate existing Spanish UI to English and do not introduce an i18n layer unless the feature explicitly requires it.

## Token Budget (hard rules)

- Use the smallest workflow that safely solves the task.
- Read only files likely relevant to the change. Never crawl the repo or `node_modules`. No full-repo analysis for small requests.
- No web search unless the task needs current external information or the user asks.
- No subagents for tiny or local changes.
- No SDD/OpenSpec artifacts for tiny direct changes.
- Do not read skills or documentation for small copy, typography, spacing, color, or Tailwind-class edits.
- Engram: at most ~3 calls before implementation; only when continuing prior work or recording a real decision.
- Never store screenshots, base64 images, logs, or large code dumps in Engram, specs, or prompts. If the user provides an image, summarize the visual issue in 1-2 sentences.
- If a small task grows, stop and explain before escalating.

## Automatic Work Mode Selection

Classify every implementation request silently — the user never names the mode. There is no mode called "SDD Lite".

| Mode                                   | Use when                                                                                                                                                                                                                                                                                                            | Behavior                                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `DIRECT`                               | Tiny, low-risk change in 1 file or a small local area: copy, typography, spacing, color, Tailwind classes, a label, a typo, an isolated bug fix                                                                                                                                                                     | No SDD, no subagents, no web, no broad reading; touch only the exact files                   |
| `SDD CONTROLLED` (`strict_tdd: false`) | 1-3 related files; limited UI behavior, component structure, validation, data fetching, or tests; reversible; no new architecture                                                                                                                                                                                   | Short plan and traceability only when useful; no RED/GREEN/REFACTOR; at most 1 focused skill |
| `SDD STRICT` (`strict_tdd: true`)      | 4+ files; database schema/migrations, auth/Clerk/roles, middleware, caching, routing, public APIs, server actions, payments (PayU), uploads (S3), integrations (n8n, OpenAI, Socket.IO, WhatsApp, Teams, ESP32), security, CI; new features or flows; ambiguous or high-risk work; user explicitly asks for SDD/TDD | Full SDD/OpenSpec discipline, Engram recovery, small batches, verification                   |

Tie-breaks: DIRECT vs CONTROLLED → choose DIRECT and stop if scope grows. CONTROLLED vs STRICT → choose STRICT. If the user explicitly picks a mode, follow it unless unsafe. Never turn a tiny visual change into SDD STRICT.

Escalation: DIRECT → CONTROLLED when more files or non-trivial behavior appear; CONTROLLED → STRICT when architecture, database, auth/roles, payments, routes, public APIs, or a 4th file appears. De-escalate only after explaining why.

### Workflow per mode

`DIRECT`: inspect only the exact relevant files → tell the user briefly in Spanish (small direct change, likely files, short plan) → wait for approval only if the user asked to approve first or the impact is not obvious → make the minimal change → run the smallest relevant validation only when it adds real signal → summarize in 1-3 lines.

`SDD CONTROLLED`: check `git status` → inspect only relevant files → keep proposal/tasks short, and only when they truly help or the user asked → explain briefly in Spanish (workflow, files, plan, validation) → wait for approval unless risk is trivial → smallest coherent change → relevant checks only → save an Engram memory only for real decisions or non-trivial fixes → summarize.

`SDD STRICT`: recover Engram context → check `git status` and OpenSpec state (initialize SDD context if missing; reuse an active relevant change) → proposal/design/tasks before implementing → explain in Spanish (change name, files, plan, validation strategy, risks) → wait for explicit approval → apply in small batches → verify against specs → run relevant checks → sync/archive after verification with approval → save an Engram session summary.

## Next.js Documentation Rule

Read the relevant installed doc under `node_modules/next/dist/docs/` only when the task depends on Next.js behavior (routing, Server Components, caching, metadata, route handlers, middleware/proxy, App Router conventions). Never for visual-only Tailwind, copy, typography, or spacing edits. Read only the exact relevant file; if missing, fall back to local skills and installed versions.

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

## Commits and PRs

Conventional commits without scope: `type: short specific summary` (feat, fix, docs, style, refactor, perf, test, build, ci, ops, chore, revert). Never add Co-Authored-By or AI attribution. PRs: clear description, linked issue when relevant, screenshots for visible UI changes, migration notes for DB changes, no unrelated churn. Never commit, push, or open a PR without explicit user approval.

## Commit & Push Integrity (MANDATORY)

Two absolute anti-cheating rules — suppressing a problem is not fixing it.

1. **Never disable linters/formatters to force a pass.** Do NOT add `eslint-disable` / `eslint-disable-next-line`, `@ts-ignore`, `@ts-expect-error`, a `// prettier-ignore`, or blanket rule-offs just to silence a warning or error. Fix the real cause (hoist nested components, refactor deprecated APIs, use proper types, mark decorative elements `aria-hidden`, etc.). A rule that genuinely does not apply project-wide may be turned off once in the central ESLint config (`eslint.cli.config.mjs`) with a justifying comment — never silenced inline per file or per line, and never the Prettier formatter.
2. **Never bypass the commit/push gate.** Do NOT use `git commit --no-verify` / `-n`, `HUSKY=0`, or any flag that skips the Husky/lint-staged hooks (Husky also runs `npm run check` on push). When a commit or push is authorized: (a) run `npm run check` (ESLint + tsc) first; (b) fix every reported error at its real cause — for vendored/tooling files not part of the app (e.g. `.agents/`, `.claude/`) exclude them at config level (`eslint.cli.config.mjs` ignore, `tsconfig.json` `exclude`); (c) only then run a normal `git commit` so the hook validates a clean tree, and push. If the hook still fails, stop and fix the cause — bypassing it ships broken code.

## Engram Memory

Use Engram only for: continuing prior work ("continúa", "retoma", "vengo de otro agente"), meaningful decisions, non-trivial bug fixes, architecture/DB/auth/payment/integration changes, end-of-session summaries, and cross-agent handoffs (objective, files changed, commands run, risks, next safe step). Never store secrets, `DATABASE_URL`, base64, screenshots, logs, or code dumps. Not for tiny visual or copy edits.

## GGA Code Review

GGA reviews staged files on pre-commit when `.gga` exists. Point its `RULES_FILE` to a short review file (e.g. `docs/CODE-REVIEW.md`), never this manual. Treat failures as real review feedback and fix the reported violations; never bypass with `git commit --no-verify` (see Commit & Push Integrity above).

## Final Safety Rules

- Never commit, push, deploy, or run migrations without explicit user approval.
- Never expose secrets or `.env` values / production credentials; keep `.env*` out of git.
- Never overwrite or revert unrelated work; preserve existing architecture; keep the app runnable after each change.
- Never run destructive database operations without explicit approval.
- Be especially careful with PayU payments, roles/permissions, and personal data; prefer reversible changes.
- Never convert a tiny visual change into a full SDD STRICT workflow.
- If unsure, ask one concise question in Spanish and stop.
