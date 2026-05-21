<!-- NEXT-AGENTS-MD-START -->

# Next.js docs-first rule

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for Next.js tasks.

Before any Next.js code change, inspect the project first, then read the relevant docs in `.next-docs`. These docs match the installed Next.js version and are the source of truth.

[Next.js Docs Index]|root: ./.next-docs|STOP. What you remember about Next.js is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: npx @next/codemod agents-md --output AGENTS.md|01-app:{04-glossary.mdx}|01-app/01-getting-started:{01-installation.mdx,02-project-structure.mdx,03-layouts-and-pages.mdx,04-linking-and-navigating.mdx,05-server-and-client-components.mdx,06-fetching-data.mdx,07-mutating-data.mdx,08-caching.mdx,09-revalidating.mdx,10-error-handling.mdx,11-css.mdx,12-images.mdx,13-fonts.mdx,14-metadata-and-og-images.mdx,15-route-handlers.mdx,16-proxy.mdx,17-deploying.mdx,18-upgrading.mdx}|01-app/02-guides:{ai-agents.mdx,analytics.mdx,authentication.mdx,backend-for-frontend.mdx,caching-without-cache-components.mdx,cdn-caching.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,data-security.mdx,debugging.mdx,deploying-to-platforms.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,how-revalidation-works.mdx,incremental-static-regeneration.mdx,instant-navigation.mdx,instrumentation.mdx,internationalization.mdx,json-ld.mdx,lazy-loading.mdx,local-development.mdx,mcp.mdx,mdx.mdx,memory-usage.mdx,migrating-to-cache-components.mdx,multi-tenant.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,ppr-platform-guide.mdx,prefetching.mdx,preserving-ui-state.mdx,production-checklist.mdx,progressive-web-apps.mdx,public-static-pages.mdx,redirecting.mdx,rendering-philosophy.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,single-page-applications.mdx,static-exports.mdx,streaming.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx,videos.mdx,view-transitions.mdx}|01-app/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|01-app/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|01-app/02-guides/upgrading:{codemods.mdx,version-14.mdx,version-15.mdx,version-16.mdx}|01-app/03-api-reference:{07-edge.mdx,08-turbopack.mdx}|01-app/03-api-reference/01-directives:{use-cache-private.mdx,use-cache-remote.mdx,use-cache.mdx,use-client.mdx,use-server.mdx}|01-app/03-api-reference/02-components:{font.mdx,form.mdx,image.mdx,link.mdx,script.mdx}|01-app/03-api-reference/03-file-conventions/01-metadata:{app-icons.mdx,manifest.mdx,opengraph-image.mdx,robots.mdx,sitemap.mdx}|01-app/03-api-reference/03-file-conventions/02-route-segment-config:{dynamicParams.mdx,instant.mdx,maxDuration.mdx,preferredRegion.mdx,runtime.mdx}|01-app/03-api-reference/03-file-conventions:{default.mdx,dynamic-routes.mdx,error.mdx,forbidden.mdx,instrumentation-client.mdx,instrumentation.mdx,intercepting-routes.mdx,layout.mdx,loading.mdx,mdx-components.mdx,not-found.mdx,page.mdx,parallel-routes.mdx,proxy.mdx,public-folder.mdx,route-groups.mdx,route.mdx,src-folder.mdx,template.mdx,unauthorized.mdx}|01-app/03-api-reference/04-functions:{after.mdx,cacheLife.mdx,cacheTag.mdx,catchError.mdx,connection.mdx,cookies.mdx,draft-mode.mdx,fetch.mdx,forbidden.mdx,generate-image-metadata.mdx,generate-metadata.mdx,generate-sitemaps.mdx,generate-static-params.mdx,generate-viewport.mdx,headers.mdx,image-response.mdx,next-request.mdx,next-response.mdx,not-found.mdx,permanentRedirect.mdx,redirect.mdx,refresh.mdx,revalidatePath.mdx,revalidateTag.mdx,unauthorized.mdx,unstable_cache.mdx,unstable_noStore.mdx,unstable_rethrow.mdx,updateTag.mdx,use-link-status.mdx,use-params.mdx,use-pathname.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,use-selected-layout-segment.mdx,use-selected-layout-segments.mdx,userAgent.mdx}|01-app/03-api-reference/05-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,appDir.mdx,assetPrefix.mdx,authInterrupts.mdx,basePath.mdx,cacheComponents.mdx,cacheHandlers.mdx,cacheLife.mdx,compress.mdx,crossOrigin.mdx,cssChunking.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,expireTime.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,htmlLimitedBots.mdx,httpAgentOptions.mdx,images.mdx,incrementalCacheHandlerPath.mdx,inlineCss.mdx,logging.mdx,mdxRs.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactCompiler.mdx,reactMaxHeadersLength.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,sassOptions.mdx,serverActions.mdx,serverComponentsHmrCache.mdx,serverExternalPackages.mdx,staleTimes.mdx,staticGeneration.mdx,taint.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,turbopackFileSystemCache.mdx,turbopackIgnoreIssue.mdx,typedRoutes.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,viewTransition.mdx,webVitalsAttribution.mdx,webpack.mdx}|01-app/03-api-reference/05-config:{02-typescript.mdx,03-eslint.mdx}|01-app/03-api-reference/06-cli:{create-next-app.mdx,next.mdx}|01-app/03-api-reference/07-adapters:{01-configuration.mdx,02-creating-an-adapter.mdx,03-api-reference.mdx,04-testing-adapters.mdx,05-routing-with-next-routing.mdx,06-implementing-ppr-in-an-adapter.mdx,07-runtime-integration.mdx,08-invoking-entrypoints.mdx,09-output-types.mdx,10-routing-information.mdx,11-use-cases.mdx}|02-pages/01-getting-started:{01-installation.mdx,02-project-structure.mdx,04-images.mdx,05-fonts.mdx,06-css.mdx,11-deploying.mdx}|02-pages/02-guides:{analytics.mdx,authentication.mdx,babel.mdx,ci-build-caching.mdx,content-security-policy.mdx,css-in-js.mdx,custom-server.mdx,debugging.mdx,draft-mode.mdx,environment-variables.mdx,forms.mdx,incremental-static-regeneration.mdx,instrumentation.mdx,internationalization.mdx,lazy-loading.mdx,mdx.mdx,multi-zones.mdx,open-telemetry.mdx,package-bundling.mdx,post-css.mdx,preview-mode.mdx,production-checklist.mdx,redirecting.mdx,sass.mdx,scripts.mdx,self-hosting.mdx,static-exports.mdx,tailwind-v3-css.mdx,third-party-libraries.mdx}|02-pages/02-guides/migrating:{app-router-migration.mdx,from-create-react-app.mdx,from-vite.mdx}|02-pages/02-guides/testing:{cypress.mdx,jest.mdx,playwright.mdx,vitest.mdx}|02-pages/02-guides/upgrading:{codemods.mdx,version-10.mdx,version-11.mdx,version-12.mdx,version-13.mdx,version-14.mdx,version-9.mdx}|02-pages/03-building-your-application/01-routing:{01-pages-and-layouts.mdx,02-dynamic-routes.mdx,03-linking-and-navigating.mdx,05-custom-app.mdx,06-custom-document.mdx,07-api-routes.mdx,08-custom-error.mdx}|02-pages/03-building-your-application/02-rendering:{01-server-side-rendering.mdx,02-static-site-generation.mdx,04-automatic-static-optimization.mdx,05-client-side-rendering.mdx}|02-pages/03-building-your-application/03-data-fetching:{01-get-static-props.mdx,02-get-static-paths.mdx,03-forms-and-mutations.mdx,03-get-server-side-props.mdx,05-client-side.mdx}|02-pages/03-building-your-application/06-configuring:{12-error-handling.mdx}|02-pages/04-api-reference:{06-edge.mdx,08-turbopack.mdx}|02-pages/04-api-reference/01-components:{font.mdx,form.mdx,head.mdx,image-legacy.mdx,image.mdx,link.mdx,script.mdx}|02-pages/04-api-reference/02-file-conventions:{instrumentation.mdx,proxy.mdx,public-folder.mdx,src-folder.mdx}|02-pages/04-api-reference/03-functions:{get-initial-props.mdx,get-server-side-props.mdx,get-static-paths.mdx,get-static-props.mdx,next-request.mdx,next-response.mdx,use-params.mdx,use-report-web-vitals.mdx,use-router.mdx,use-search-params.mdx,userAgent.mdx}|02-pages/04-api-reference/04-config/01-next-config-js:{adapterPath.mdx,allowedDevOrigins.mdx,assetPrefix.mdx,basePath.mdx,bundlePagesRouterDependencies.mdx,compress.mdx,crossOrigin.mdx,deploymentId.mdx,devIndicators.mdx,distDir.mdx,env.mdx,exportPathMap.mdx,generateBuildId.mdx,generateEtags.mdx,headers.mdx,httpAgentOptions.mdx,images.mdx,logging.mdx,onDemandEntries.mdx,optimizePackageImports.mdx,output.mdx,pageExtensions.mdx,poweredByHeader.mdx,productionBrowserSourceMaps.mdx,proxyClientMaxBodySize.mdx,reactStrictMode.mdx,redirects.mdx,rewrites.mdx,serverExternalPackages.mdx,trailingSlash.mdx,transpilePackages.mdx,turbopack.mdx,typescript.mdx,urlImports.mdx,useLightningcss.mdx,webVitalsAttribution.mdx,webpack.mdx}|02-pages/04-api-reference/04-config:{01-typescript.mdx,02-eslint.mdx}|02-pages/04-api-reference/05-cli:{create-next-app.mdx,next.mdx}|02-pages/04-api-reference/06-adapters:{01-configuration.mdx,02-creating-an-adapter.mdx,03-api-reference.mdx,04-testing-adapters.mdx,05-routing-with-next-routing.mdx,06-implementing-ppr-in-an-adapter.mdx,07-runtime-integration.mdx,08-invoking-entrypoints.mdx,09-output-types.mdx,10-routing-information.mdx,11-use-cases.mdx}|03-architecture:{accessibility.mdx,fast-refresh.mdx,nextjs-compiler.mdx,supported-browsers.mdx}|04-community:{01-contribution-guide.mdx,02-rspack.mdx}

<!-- NEXT-AGENTS-MD-END -->

# Repository Guidelines

This is Artiefy, a Next.js 16 App Router app with React 19, TypeScript, Tailwind CSS 4, Clerk, Drizzle ORM, Neon Postgres, AWS S3, Upstash Redis, OpenAI, n8n integrations, PayU payments, next-video, Plaiceholder, shadcn/Radix UI, ESLint 10, Prettier, Husky, and lint-staged.

## Skill Use

Skills live in `.agents/skills/` and are tracked by `skills-lock.json`. Load only the skill required by the task. Do not load skills just in case. If no row matches, use these repo rules and existing code patterns.

Installed skills:
`accessibility`, `bash-defensive-patterns`, `clerk`, `clerk-backend-api`, `clerk-custom-ui`, `clerk-nextjs-patterns`, `clerk-orgs`, `clerk-react-patterns`, `clerk-setup`, `clerk-testing`, `clerk-webhooks`, `composition-patterns`, `deploy-to-vercel`, `drizzle`, `frontend-design`, `n8n-workflow-patterns`, `neon-postgres`, `next-best-practices`, `next-cache-components`, `next-upgrade`, `nodejs-backend-patterns`, `nodejs-best-practices`, `react-best-practices`, `seo`, `shadcn`, `skill-creator`, `skill-installer`, `tailwind-css-patterns`, `tailwind-v4-shadcn`, `threejs-animation`, `threejs-fundamentals`, `threejs-geometry`, `threejs-interaction`, `threejs-lighting`, `threejs-loaders`, `threejs-materials`, `threejs-postprocessing`, `threejs-shaders`, `threejs-textures`, `typescript-advanced-types`, `zod`.

Auto-invoke map:
| Task | Skill |
|------|-------|
| Next.js route/page/layout, App Router, RSC, Server Actions, async APIs, route handlers | `next-best-practices` |
| Next.js cache, PPR, `use cache`, `cacheLife`, `cacheTag`, `revalidate*`, `updateTag` | `next-cache-components` |
| Next.js upgrade or codemods | `next-upgrade` |
| React component work or performance review | `react-best-practices` |
| Component API design, slots, children, compound components, render props | `composition-patterns` |
| UI layout, visual hierarchy, responsive styling, mockups | `frontend-design` |
| Tailwind classes, responsive utilities, colors, hover states, dark mode | `tailwind-css-patterns` |
| Tailwind CSS v4 with shadcn/ui setup | `tailwind-v4-shadcn` |
| shadcn/ui components, styling, composition, or debugging | `shadcn` |
| Metadata, SEO, sitemap, robots, OG images, JSON-LD | `seo` |
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
| Vercel deployment | `deploy-to-vercel` |
| n8n workflow architecture, workflow design, or automation patterns | `n8n-workflow-patterns` |
| Bash scripts, CI shell scripts, or defensive shell patterns | `bash-defensive-patterns` |
| Advanced TypeScript types | `typescript-advanced-types` |
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

## Project Map

| Area           | Location                                     |
| -------------- | -------------------------------------------- |
| App Router     | `src/app/`                                   |
| API routes     | `src/app/api/`                               |
| Dashboards     | `src/app/dashboard/`                         |
| Student pages  | `src/app/estudiantes/`                       |
| Components     | `src/components/`                            |
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
- Use strict TypeScript; avoid `any` unless isolated and justified.
- Use absolute imports via `~/` unless importing from the same directory.
- Default exports are allowed for Next.js pages/layouts; prefer named exports elsewhere.
- App Router dynamic pages in this project use normal route params such as `[id]`, `[courseId]`, and catch-all Clerk auth routes; do not add locale routing unless the feature explicitly introduces it.
- Dashboard pages sit behind Clerk auth and role-based access; preserve existing role checks for `super-admin`, `admin`, `educadores`, and students.
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
- If adding tests, add or reuse the required test runner configuration in the same change and keep test files close to implementation.
- Avoid mocking unless necessary.
- Conventional commits: `type: short specific summary` with `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`.
- Before PRs: run relevant checks, include screenshots for visible UI changes, and avoid unrelated churn.

## Responses

Keep responses concise. When changing code, summarize files changed and checks run. State clearly when a relevant check was not run.
