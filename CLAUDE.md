# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Artiefy: production education platform (Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/Radix + Mantine + Headless UI, Clerk, Drizzle + Neon Postgres, Upstash Redis, AWS S3, PayU, n8n, OpenAI). The stack is fixed: never introduce another framework, database, ORM, auth provider, styling system, package manager, or deployment platform unless asked. Deployed on Vercel (`vercel.json`: region `iad1`, crons, security headers, install with `--legacy-peer-deps`).

## Commands

- `npm run dev` / `build` (`next build --debug-prerender`) / `start` / `preview`.
- Check gate: `npm run check` = ESLint with `eslint.cli.config.mjs` (`--max-warnings=0`) + `tsc --noEmit`. `check:ts6` / `typecheck:ts6` run the same with `tsc6` (TypeScript 6). Also `lint`, `lint:fix`, `typecheck`, `typecheck:watch`.
- `format:check` / `format:write` only glob `ts, js, jsx, mdx` (no `tsx`, json, css); lint-staged runs Prettier on all staged files anyway.
- DB: `db:generate`, `db:migrate`, `db:push`, `db:studio`. `npm run embeddings:regen` does a full OpenAI re-embedding. Ask for explicit approval before any `db:*` or `embeddings:regen`; never `db:push` or destructive SQL without it.
- No test runner or test script exists (`openspec/config.yaml` also says so), so `check` is the only baseline verification.
- Hooks (Husky): pre-commit runs lint-staged (ESLint `--fix` with the CLI config, then Prettier); pre-push runs `npm run check`. `npm run setup:hooks` reinstalls them.
- Toolchain quirk: `typescript` is aliased to `@typescript/typescript6` (typescript-eslint needs its JS API) while `node_modules/.bin/tsc` is TypeScript 7 (`@typescript/native`); `next.config.ts` sets `experimental.useTypeScriptCli: false` for this. `.npmrc` has `legacy-peer-deps=true`. Node `^24.15.0`, `packageManager` npm 12.

## Architecture

- **Roles and access.** Clerk session claims carry `metadata.role`: `super-admin`, `admin`, `educador`, `estudiante` (`src/utils/roles.ts`; role `educador` maps to `/dashboard/educadores`). `src/proxy.ts` (Clerk middleware) sends privileged roles to their own dashboard (`/dashboard/{super-admin,admin,educadores}`), protects `/dashboard/**`, and redirects students with an expired paid plan away from `/estudiantes/clases/**` to `/planes`. The expiry check reads `planType`, `subscriptionStatus`, and `subscriptionEndDate` from the JWT and fails open when they are absent, so the Clerk session token template must include them.
- **API routes are not protected by the middleware.** Each handler must authenticate and authorize itself (`src/server/utils/apiAuth.ts`, owner-or-staff; educator course ownership is checked server-side, see `src/server/queries/educatorCourseAccess.ts`). Public by design: `/api/webhooks/clerk` (svix signature), `/api/image-proxy`, and the WhatsApp webhook/health/inbox routes.
- **Clerk metadata writes** must go through `fusionarMetadatosPublicos` (`src/server/lib/clerk-metadata.ts`). `updateUserMetadata` replaces the whole `publicMetadata` object, and a bare write once wiped `role` and demoted users to student.
- **Database.** `db` (`src/server/db/index.ts`) is the Neon HTTP driver over one schema (`src/server/db/schema.ts`); migrations go to `drizzle/` and run over `POSTGRES_URL_NON_POOLING` when set. Wrap idempotent reads that can hit a cold Neon compute in `withRetry`. Guided-project transactions build a short-lived `Pool` + `drizzle` instead of using `db`. Ad-hoc SQL lives in `scripts/*.sql`.
- **Payments (PayU, Colombia).** `generatePaymentData`, `generateCoursePayment`, and `generateGuidedProjectPayment` build the signed checkout; PayU then calls `confirmPayment` (plans), `confirmCoursePayment`, and `confirmGuidedProjectPayment` server-to-server. The MD5 `sign` is verified in `src/utils/paygateway/verifySignature.ts` (amount formatted with one decimal when integral, otherwise two); only `state_pol === '4'` counts as approved, and plan payments then call `updateUserSubscription`. `resolvePayUMode` in `paygateway/auth.ts` forces sandbox whenever `NODE_ENV !== 'production'`; in production it needs `PAYU_MODE` and the `PAYU_PROD_*` credentials, and PayU's public demo credentials must never be used there.
- **Uploads.** S3 via presigned URLs and `src/app/api/upload` / `api/video/upload` (60 s max). Server Actions accept 5 MB bodies only. Remote images are limited to the origins in `next.config.ts`; `/api/image-proxy` validates its `url` against the S3 origin and bucket key.
- **Background jobs** (Vercel Cron, `vercel.json`): `/api/cron/check-subscriptions` daily, `whatsapp` every minute, `transcriptions` every 5 minutes, `embeddings` every 10 minutes. Every cron handler checks `Authorization` against `CRON_SECRET`. The embeddings cron re-indexes courses and guided projects whose content changed since their last embedding, instead of re-indexing on every write.
- **Integrations.** n8n webhooks (agents chat, project generation) and OpenAI; Upstash Redis for rate limiting and the agent-chat quota (`src/server/agents/agentChatQuota.ts`: anon 5 and free 10 messages lifetime, premium 50 per day, day buckets in `America/Bogota`); WhatsApp (`src/server/whatsapp`, `api/super-admin/whatsapp/*`); Microsoft Teams through Graph (`src/lib/getGraphToken.ts`, `api/super-admin/teams/*`); ESP32 door controller (`hardware/esp32-puerta`, `src/server/esp32`); a transcription service (`TRANSCRIBE_API_URL`). Root `server.js` / `server.cjs` are a standalone Express ffmpeg helper (`/video2text`), not part of the Next build. Socket.IO is disabled: `src/lib/socket.ts` is a no-op stub.
- **Cache Components** (`cacheComponents`) and `partialPrefetching` are on, `typedRoutes` is on, and `reactCompiler` is off. About 33 files export `instant` (the root `app/layout.tsx` uses `instant = false`); `'use cache'` is used in `estudiantes/_cache/programs.ts` and `server/queries/queries.ts`. Read request data (auth, headers, cookies) accordingly.

## Rules and pitfalls

- UI copy is Spanish-first and not wired to next-intl. Keep copy consistent with nearby UI, never translate existing Spanish UI, and do not add locale routing or an i18n layer unless the feature requires it. Dynamic routes use plain params (`[id]`, `[courseId]`).
- Extra SDD STRICT triggers: payments (PayU), uploads (S3), integrations (n8n, OpenAI, WhatsApp, Teams, ESP32, Socket.IO). Be especially careful with PayU, roles/permissions, and personal data; prefer reversible changes, and verify env vars and failure behavior before closing work on payments, S3, Redis, OpenAI, WhatsApp, or the database.
- Preserve existing role checks for `super-admin`, `admin`, `educador`, and `estudiante`. Follow the existing helpers and route patterns before adding new integration code.
- Imports use `~/` (NOT `@/`) unless same directory. Prettier (`prettier.config.mjs`): 2 spaces, LF, semicolons, single quotes, 80 columns, Tailwind class sorting. Use `React.ReactNode`; no unnecessary `useEffect`; no `useMemo`/`useCallback` without a measured reason.
- Lint config: `eslint.config.mjs` is the editor config (no type info, on purpose); `eslint.cli.config.mjs` adds type-checked rules through `tsconfig.eslint.json`, is slow, and is what `check`, `lint`, and lint-staged use. Do not point VS Code at it.
- Env is validated in `src/env.ts` (t3-env; `SKIP_ENV_VALIDATION` bypasses it) and `next.config.ts` imports it, so a build needs the required vars. Direct `process.env` reads exist only in bootstrap-style spots (`src/proxy.ts`, `src/lib/emails/*`); do not add more. Names: `POSTGRES_*`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `UPSTASH_REDIS_REST_*`, `AWS_*`, PayU (`MERCHANT_ID`, `ACCOUNT_ID`, `API_LOGIN`, `API_KEY`, `PAYU_MODE`, `PAYU_TEST_*`, `PAYU_PROD_*`, `PAYU_API_URL`, `RESPONSE_URL`, `CONFIRMATION_URL*`), `PASS` (mail password), `CRON_SECRET`, `N8N_*`, `OPENAI_*`, `ESP32_*`, `TRANSCRIBE_*`, `NEON_API_KEY`, `GITHUB_TOKEN`, and the `NEXT_PUBLIC_*` Clerk, S3, base URL, PayU, and n8n keys. `Docs/ENVIRONMENT_VARIABLES_SYNC.md` covers syncing them.
- Long-form references, read on demand: `Docs/` (n8n, PayU, ESP32, WhatsApp scheduling, embeddings), `openspec/` (SDD artifacts, `strict_tdd: false`), and `NEXTJS_16_3_AGENT_RUNBOOK.md` (Next.js upgrades).
