<!-- NEXT-AGENTS-MD-START -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines

This is Artiefy, a Next.js 16 App Router app with React 19, TypeScript, Tailwind CSS 4, Clerk, Drizzle ORM, Neon Postgres, AWS S3, Upstash Redis, OpenAI, n8n integrations, PayU payments, next-video, Plaiceholder, shadcn/Radix UI, ESLint 10, Prettier, Husky, and lint-staged.

## Skill Use

Skills live in `.agents/skills/` and are tracked by `skills-lock.json`. Load only the skill required by the task. Do not load skills just in case. If no row matches, use these repo rules and existing code patterns.

Installed skills:
`accessibility`, `agents-md-maintainer`, `animejs`, `bash-defensive-patterns`, `clerk`, `clerk-backend-api`, `clerk-custom-ui`, `clerk-nextjs-patterns`, `clerk-orgs`, `clerk-react-patterns`, `clerk-setup`, `clerk-testing`, `clerk-webhooks`, `composition-patterns`, `compatibility-testing`, `context7-cli`, `context7-mcp`, `contribute-catalog`, `css-animations`, `deploy-to-vercel`, `drizzle`, `frontend-code-review`, `frontend-design`, `gsap`, `hyperframes`, `hyperframes-cli`, `hyperframes-media`, `hyperframes-registry`, `lottie`, `mcp-server-patterns`, `n8n-workflow-patterns`, `neon-postgres`, `next-best-practices`, `next-cache-components`, `next-upgrade`, `nodejs-backend-patterns`, `nodejs-best-practices`, `playwright-dev`, `react-best-practices`, `react-expert`, `react-modernization`, `react-pdf`, `react-web`, `redis-js`, `remotion-to-hyperframes`, `responsive-design`, `responsive-web-design`, `seo`, `seo-audit`, `shadcn`, `skill-creator`, `skill-installer`, `tailwind`, `tailwind-css-patterns`, `tailwind-v4-shadcn`, `three`, `threejs-animation`, `threejs-fundamentals`, `threejs-geometry`, `threejs-interaction`, `threejs-lighting`, `threejs-loaders`, `threejs-materials`, `threejs-postprocessing`, `threejs-shaders`, `threejs-textures`, `typegpu`, `typescript-advanced-types`, `waapi`, `web-design-guidelines`, `website-to-hyperframes`, `xlsx`, `zod`.

Auto-invoke map:
| Task | Skill |
|------|-------|
| Current library/framework/API docs, setup examples, or code using external packages | `context7-mcp` |
| ctx7 CLI usage, Context7 setup, searching/installing/generating skills | `context7-cli` |
| Next.js route/page/layout, App Router, RSC, Server Actions, async APIs, route handlers | `next-best-practices` |
| Next.js cache, PPR, `use cache`, `cacheLife`, `cacheTag`, `revalidate*`, `updateTag` | `next-cache-components` |
| Next.js upgrade or codemods | `next-upgrade` |
| React component work or performance review | `react-best-practices` |
| React web pages/components using hooks, React Query, Zustand, or client state | `react-web` |
| React API research, official React behavior, caveats, warnings, or examples | `react-expert` |
| React modernization, React upgrades, class-to-hooks migration, concurrent features, codemods | `react-modernization` |
| Frontend code review for `.tsx`, `.ts`, `.js`, or pending UI changes | `frontend-code-review` |
| Component API design, slots, children, compound components, render props | `composition-patterns` |
| UI layout, visual hierarchy, responsive styling, mockups | `frontend-design` |
| UI/UX/design-system audit, web interface guideline review, design best-practice review | `web-design-guidelines` |
| Responsive layouts, mobile/tablet/desktop behavior, fluid typography, container queries, viewport overflow, touch targets | `responsive-design` |
| Mobile-first layouts, Flexbox/Grid responsive UI, media queries, flexible UI systems, or cross-browser responsive CSS | `responsive-web-design` |
| Cross-browser, cross-platform, cross-device, browser support, device matrix, or compatibility validation | `compatibility-testing` |
| Tailwind classes, responsive utilities, colors, hover states, dark mode | `tailwind-css-patterns` |
| Tailwind CSS v4 with shadcn/ui setup | `tailwind-v4-shadcn` |
| shadcn/ui components, styling, composition, or debugging | `shadcn` |
| HyperFrames HTML video composition, title cards, overlays, synced captions, voiceovers, audio-reactive visuals, animated text highlights, or scene transitions | `hyperframes` |
| HyperFrames CLI commands such as `npx hyperframes`, `init`, `lint`, `inspect`, `preview`, `render`, `doctor`, `browser`, `info`, or `upgrade` | `hyperframes-cli` |
| HyperFrames asset preprocessing: TTS voiceover, speech transcription, captions from audio/video, background removal, or model selection for Kokoro/Whisper/u2net | `hyperframes-media` |
| HyperFrames registry blocks/components, `hyperframes add`, installed registry items, `hyperframes.json`, or wiring blocks/components into compositions | `hyperframes-registry` |
| Convert, port, migrate, translate, or rewrite an existing Remotion React video composition into HyperFrames | `remotion-to-hyperframes` |
| Capture a website URL and turn it into a HyperFrames video, product tour, promo, social ad, or video content from an existing site | `website-to-hyperframes` |
| GSAP animations inside HyperFrames compositions, timelines, labels, stagger, easing, or render-safe GSAP motion | `gsap` |
| Anime.js animations or timelines inside HyperFrames compositions, seek-driven Anime.js, or translating Anime.js examples into HyperFrames | `animejs` |
| CSS keyframes, animation delays, fill modes, play states, or CSS-only motion that must seek deterministically in HyperFrames | `css-animations` |
| Web Animations API / WAAPI motion in HyperFrames, `element.animate()`, `currentTime` seeking, `document.getAnimations()`, or `KeyframeEffect` timing | `waapi` |
| Lottie or dotLottie animations in HyperFrames, `lottie-web`, `.lottie`, `@lottiefiles/dotlottie-web`, or deterministic After Effects exports | `lottie` |
| Tailwind CSS v4 browser-runtime patterns specifically inside HyperFrames compositions or `hyperframes init --tailwind` projects | `tailwind` |
| Three.js or WebGL specifically inside HyperFrames compositions, `hf-seek` canvas layers, deterministic WebGL scenes, camera motion, or shader visuals | `three` |
| TypeGPU, raw WebGPU, WGSL shaders, compute pipelines, liquid glass, particle systems, or GPU canvas layers inside HyperFrames | `typegpu` |
| Contribute a new public HyperFrames registry block/component upstream to the hyperframes catalog | `contribute-catalog` |
| Metadata, SEO, sitemap, robots, OG images, JSON-LD | `seo` |
| SEO audit, technical SEO diagnosis, rankings/traffic drops, crawl/indexing/Core Web Vitals issues | `seo-audit` |
| Clerk setup | `clerk-setup` |
| Clerk + Next.js middleware, API routes, Server Actions, caching | `clerk-nextjs-patterns` |
| Clerk custom UI, sign-in/sign-up flows, appearance, branding | `clerk-custom-ui` |
| Clerk organizations, RBAC, org routing, members, B2B workspaces | `clerk-orgs` |
| Clerk React SPA hooks or protected routes | `clerk-react-patterns` |
| Clerk Backend API | `clerk-backend-api` |
| Clerk webhooks | `clerk-webhooks` |
| Clerk E2E auth tests | `clerk-testing` |
| General Clerk question | `clerk` |
| Drizzle schema, queries, migrations, models | `drizzle` |
| Neon Postgres setup, connection, branching, or database guidance | `neon-postgres` |
| Upstash Redis SDK, caching, rate limiting, sessions, Redis data structures/search | `redis-js` |
| Vercel deployment | `deploy-to-vercel` |
| Developing Playwright itself, adding Playwright APIs, MCP tools, CLI commands, or vendor dependencies | `playwright-dev` |
| n8n workflow architecture, workflow design, or automation patterns | `n8n-workflow-patterns` |
| MCP server implementation, tools/resources/prompts, Zod validation, stdio or Streamable HTTP transport | `mcp-server-patterns` |
| Bash scripts, CI shell scripts, or defensive shell patterns | `bash-defensive-patterns` |
| Advanced TypeScript types | `typescript-advanced-types` |
| Spreadsheet files as primary input/output, `.xlsx`, `.xlsm`, `.csv`, `.tsv`, formulas, formatting, conversions | `xlsx` |
| PDF generation with React PDF, `@react-pdf/renderer`, or JSON specs to PDF | `react-pdf` |
| Node backend/server logic/errors/middleware/API design | `nodejs-backend-patterns` |
| General Node architecture, async, modules, performance, security | `nodejs-best-practices` |
| Accessibility, ARIA, keyboard navigation, contrast | `accessibility` |
| Zod schemas, parsing, errors, inference | `zod` |
| Three.js scene setup, cameras, renderer, or coordinate systems | `threejs-fundamentals` |
| Three.js animation, mixers, keyframes, or morph targets | `threejs-animation` |
| Three.js geometry, buffers, shapes, or instancing | `threejs-geometry` |
| Three.js raycasting, controls, pointer, mouse, or touch input | `threejs-interaction` |
| Three.js lighting, shadows, environment lighting, or IBL | `threejs-lighting` |
| Three.js GLTF, textures, images, models, or async asset loading | `threejs-loaders` |
| Three.js PBR, shader, phong, or custom materials | `threejs-materials` |
| Three.js post-processing, bloom, DOF, or screen effects | `threejs-postprocessing` |
| Three.js GLSL shaders, uniforms, or custom visual effects | `threejs-shaders` |
| Three.js texture types, UV mapping, or environment maps | `threejs-textures` |
| Create/update skills | `skill-creator` |
| List/install/update skills | `skill-installer` |
| Sync `AGENTS.md` with `.agents/skills`, package scripts, repo workflows, hooks, or Codex automation prompts | `agents-md-maintainer` |

## AGENTS.md Sync Workflow

- Keep `Installed skills` and the auto-invoke map aligned with the actual directories in `.agents/skills/`; that folder is the source of truth.
- When a new local skill appears, read its `SKILL.md` and add the narrowest useful auto-invoke row. If the trigger is unclear, add `PENDIENTE: revisar disparador para <skill>` instead of inventing one.
- Preserve the generated Next.js docs block and existing repo-specific rules; only edit the sections needed for skills, workflows, or commands discovered in the repo.

## Project Map

| Area           | Location                                     |
| -------------- | -------------------------------------------- |
| App Router     | `src/app/`                                   |
| API routes     | `src/app/api/`                               |
| Dashboards     | `src/app/dashboard/`                         |
| Student pages  | `src/app/estudiantes/`                       |
| Components     | `src/components/`                            |
| Hooks          | `src/hooks/`                                 |
| Helpers        | `src/lib/`, `src/utils/`                     |
| Types          | `src/types/`, `types/`                       |
| Server code    | `src/server/`                                |
| Server actions | `src/server/actions/`                        |
| Server queries | `src/server/queries/`                        |
| Database       | `src/server/db/`, `drizzle/`, `migrations/`  |
| Env config     | `src/env.ts`                                 |
| Styles         | `src/styles/globals.css`, `src/styles/*.css` |
| Static assets  | `public/`, `videos/`                         |
| Scripts        | `scripts/`                                   |
| Docs           | `Docs/`, `.next-docs/`                       |

## Commands

Use Node.js 24.x and npm 11.x when possible.

```bash
npm install
npm run dev
npm run build
npm run start
npm run preview
npm run check
npm run lint
npm run lint:fix
npm run typecheck
npm run format:check
npm run format:write
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run embeddings:regen
```

## Code Rules

- Keep changes scoped; do not reformat unrelated files.
- Formatting is 2 spaces, LF endings, UTF-8, semicolons, single quotes, and an
  80 character print width. Prettier sorts Tailwind classes.
- Use strict TypeScript; avoid `any` unless isolated and justified.
- Use absolute imports via `~/` unless importing from the same directory.
- Default exports are allowed for Next.js pages/layouts; prefer named exports elsewhere.
- Use PascalCase for React components and camelCase for functions and variables.
- Keep route-folder names aligned with Next.js conventions.
- App Router dynamic pages in this project use normal route params such as `[id]`, `[courseId]`, and catch-all Clerk auth routes; do not add locale routing unless the feature explicitly introduces it.
- Dashboard pages sit behind Clerk auth and role-based access; preserve existing role checks for `super-admin`, `admin`, `educadores`, and students.
- Keep server-only logic in `src/server` or route handlers.
- User-visible text is currently Spanish-first and not wired to next-intl; keep copy consistent with nearby UI unless an i18n layer is added deliberately.
- Use Tailwind CSS 4 utility classes and existing CSS from `src/styles/globals.css` and focused `src/styles/*.css` files.
- Reuse shared components before creating new ones.
- Avoid unnecessary `useEffect`.
- Do not add `useMemo` or `useCallback` unless there is a measured or documented reason.
- Use `React.ReactNode`, not imported `ReactNode`.
- Validate server env vars through `src/env.ts`; avoid direct `process.env` reads in new app/server code unless matching an existing bootstrap/config pattern or using `NEXT_PUBLIC_*` in client-facing code.
- Keep database changes in Drizzle schema/migrations and use `drizzle-kit` commands from `package.json`.
- For S3 uploads, PayU, n8n, OpenAI, Upstash, ESP32, Socket.IO, and Microsoft Teams integrations, follow the existing helpers and route patterns before adding new integration code.

## Tests And PRs

- No dedicated test runner script is currently configured in `package.json`; use `npm run check`, `npm run lint`, and `npm run typecheck` as the baseline verification.
- Manually verify the affected route or API before submitting changes.
- If adding tests, add or reuse the required test runner configuration in the same change and keep test files close to implementation or in `test/`; use names such as `course-progress.test.ts`.
- Avoid mocking unless necessary.
- Conventional commits: `type: short specific summary` with `feat|fix|docs|style|refactor|perf|test|build|ci|ops|chore|revert`.
- Husky runs `lint-staged` on commit and `npm run check` on push.
- Before PRs: run relevant checks, include a clear description, linked issue when relevant, screenshots for visible UI changes, migration notes for database changes, and avoid unrelated churn.

## Security And Configuration

- Do not commit secrets from `.env` or production credentials.
- Use examples in `src/config` for local setup when present.
- For auth, payments, S3, Redis, OpenAI, WhatsApp, or database changes, verify environment variables and failure behavior.

## Responses

Keep responses concise. When changing code, summarize files changed and checks run. State clearly when a relevant check was not run.
