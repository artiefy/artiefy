# Design: Instant Navigation for the Student Area

- **Phase:** `sdd-design` · **Artifact store:** hybrid · **Delivery:** exception-ok · **Review budget:** 800 lines
- **Inputs:** `proposal.md` (authoritative), `explore.md`
- **Settled user decisions honoured:** `proyectos` real files in scope · root-layout opt-out removed · 4 dead dashboard dirs deleted · `/v2` year cached · `@clerk/ui ~1.28.0`

## Technical Approach

Three layers per adopted route, in this order of paint:

```
  STATIC SHELL          CACHED (`'use cache'`)        DYNAMIC (<Suspense>)
  sync page body   ──→  _cache/ wrapper, key = id  ──→ params/searchParams + auth()
  chrome, headings      public course/program data     enrollment, progress, grades
  Footer, skeleton      cacheLife + cacheTag           never cached, never a cache key
  layout reserved       ↑ never imports auth()         ↑ streams behind a shaped skeleton
```

Build health is restored before anything else, because every gate (A build, B check, C dev/browser) depends on a green build. Then the lint guardrail is armed, then validation is restored, then routes are adopted one at a time.

## Architecture Decisions

### A. Where cached wrappers live — `src/app/estudiantes/_cache/`, enforced by lint

**Choice:** confirm the proposal's `src/app/estudiantes/_cache/*.ts`, and make the §3 rule mechanical with two `no-restricted-syntax` overrides in `eslint.cli.config.mjs`.

| Option                                 | Trade-off                                                                                                                                                                                                                | Verdict    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `src/app/estudiantes/_cache/` (chosen) | New convention — the repo has **zero** `_`-prefixed folders under `src/app` today. But `_`-prefixed dirs are excluded from routing by Next, the path itself states the scope, and the glob for a lint rule is trivial.   | **Chosen** |
| `src/server/queries/cached/`           | Matches the repo's "server code lives in `src/server/**`" convention, but places cache directives inside the exact tree §3 forbids and invites reuse from `api/**` and `dashboard/**`. Convention loses to blast radius. | Rejected   |
| Inline in each `page.tsx`              | Zero new files, but scatters directives across 9 files, makes the lint glob a per-file allowlist, and the wrappers cannot be reused between a page and its `generateMetadata`.                                           | Rejected   |

**Structural enforcement** (this is what makes it hard to violate, not merely documented):

```js
// eslint.cli.config.mjs — two overrides
{ files: ['src/server/**/*.{ts,tsx}'],
  rules: { 'no-restricted-syntax': ['error',
    { selector: "ExpressionStatement > Literal[value=/^use cache/]",
      message: "Never cache in src/server/** — see openspec/changes/estudiantes-instant-navigation §3." }],
    'no-restricted-imports': ['error', { paths: [{ name: 'next/cache',
      importNames: ['cacheLife', 'cacheTag'],
      message: 'Cache at the estudiantes call-site (src/app/estudiantes/_cache/).' }] }] } },
{ files: ['src/app/**/*.{ts,tsx}'],
  ignores: ['src/app/estudiantes/_cache/**', 'src/app/v2/**'],
  rules: { 'no-restricted-syntax': ['error', { selector: "ExpressionStatement > Literal[value=/^use cache/]",
    message: "'use cache' belongs in src/app/estudiantes/_cache/." }] } }
```

`npm run check` runs ESLint with `--max-warnings=0` and Husky runs it on pre-push, so a violating diff cannot reach `main`. `revalidateTag` / `updateTag` are deliberately **not** restricted in `src/server/**`: invalidation is safe to share, caching is not.

**Wrapper contract** (second structural guard, at the type level): every wrapper's signature accepts only a route id — `(id: number | string)`. No wrapper takes `userId`, `sessionClaims`, or a Clerk object, so per-user data cannot become part of a cache key by accident. Wrapper return types are narrowed with `Pick<…>` to public fields only.

### A-bis. Undeclared prior art: `unstable_cache` (design flaw found in explore + proposal)

`getAllLearningItems` (`src/server/actions/estudiantes/getAllLearningItems.ts:248`), `getAllPrograms` (`:179`) and `getAllCategories` (`:14`) are already `unstable_cache(...)` wrappers with `revalidate: 60` and tags (`learning-items`, …). Neither `explore.md` §1 nor the proposal records this.

Two consequences:

1. Next 16 replaces `unstable_cache` with `'use cache'`. The migration guide says existing `unstable_cache` "keeps working as a separate layer" — it is a _data_ cache, not a Cache Components boundary, so it does **not** clear `blocking-prerender-dynamic` on the catalog.
2. Nesting `unstable_cache` inside a `'use cache'` scope with a disagreeing lifetime is a documented prerender error (`cacheLife.md` §nested short-lived caches). A 60s inner `revalidate` under an `hours` outer wrapper is exactly that shape.

| Option                                                                                   | Trade-off                                                                                                                                                                                           | Verdict    |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Wrapper calls the **uncached loader**, requires widening one `export` in `src/server/**` | Touches a tree the proposal declared untouched — but only to add the `export` keyword to an existing function. Zero behavior change for the 25+ consumers; the `unstable_cache` export stays as-is. | **Chosen** |
| Wrap the `unstable_cache` function directly in `'use cache'`                             | Smallest diff, but two invalidation surfaces that can disagree and a live nested-lifetime error risk.                                                                                               | Rejected   |
| Convert `getAllLearningItems` itself to `'use cache'`                                    | This _is_ the §3 violation — 20 API/cron/webhook consumers.                                                                                                                                         | Rejected   |

**Carve-out, stated narrowly so it cannot widen:** `src/server/**` may be edited **only** to add an `export` keyword to an existing function. No body change, no directive, no signature change. Any other hunk under `src/server/**` is a review blocker. If the loaders turn out not to be separable, the fallback is Suspense-only (uncached) catalog — record it, do not improvise.

### B. The Clerk `auth()` boundary

**Standard shape.** The page component is **synchronous** — no `async`, no top-level `await`, no `auth()`. `params`/`searchParams` are forwarded as promises. Every runtime read lives inside a single `<Suspense>` child.

Canonical before/after on `src/app/estudiantes/clases/[id]/page.tsx` — the hardest case (`await params` at `:54`, `auth()` + `redirectToSignIn()` at `:60`):

```tsx
// AFTER — shell is sync; params + auth() moved into the existing boundary
export default function LessonPage({ params }: PageProps) {
  return (
    <>
      <link rel="preconnect" href="https://s3.us-east-2.amazonaws.com" />
      <link rel="dns-prefetch" href="https://s3.us-east-2.amazonaws.com" />
      <main>
        <Suspense fallback={<LessonSkeleton />}>
          <LessonContent params={params} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return notFound();

  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  const role = getUserRole(sessionClaims?.metadata?.role);
  // …existing LessonContent body verbatim from :93 onward
}
```

`sdd-apply` pattern-matches this on `cursos/[id]`, `proyectos-guiados/[id]`, `certificados`, `perfil`, `proyectos`, `proyectos/[id]`. No role check, gate, or redirect is removed — each one moves inside the boundary unchanged.

**Per-user data never enters a cached scope.** Cached wrappers are keyed by route id only. `auth()`, `currentUser()`, `sessionClaims`, subscription fields, grades, certificates and profile fields are read **below** the Suspense boundary and passed only to uncached components. A `userId` argument to a cached wrapper would silently create a per-user cache entry that survives sign-out — blocked by the wrapper contract in A and by the lint rule.

**Risk this shape introduces (new — not in the proposal):** `redirect()`, `redirectToSignIn()` and `notFound()` thrown _inside_ a Suspense child fire after the shell has flushed, so they arrive as an RSC navigation instead of an HTTP redirect. Gate C must include a **logged-out** visit to `/estudiantes/clases/1` and `/estudiantes/certificados`, and an `educador` visit to a course they do not own.

### C. `cacheLife` profile table

**Premise correction (verified in `node_modules/next/dist/docs/.../cacheLife.md:139-147, 262-270`):** every preset except `seconds` has `stale: 5 minutes`, so **`minutes`, `hours`, `days`, `weeks`, `max` are all App-Shell eligible**. Only `seconds` is excluded, via its `expire: 1 minute`. Profile choice therefore governs freshness and background revalidation — not shell membership. `seconds` is banned in this change for that reason.

| Cached surface                                                          | Wrapper                                  | Profile   | revalidate / expire | Tag(s)                                     | Rationale — what a stale student sees                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------- | ---------------------------------------- | --------- | ------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog listing (`/estudiantes`)                                        | `_cache/getCatalog.ts`                   | `hours`   | 1h / 1d             | `learning-items`, `programs`, `categories` | Publishing is an educator action on the dashboard. Worst case: a course published 40 min ago is missing from the grid — an omission, never wrong data. Reuses the existing `learning-items` tag so today's `revalidateTag` call sites keep working.                        |
| Course detail, public fields (`cursos/[id]`)                            | `_cache/getPublicCourse.ts`              | `hours`   | 1h / 1d             | `course-{id}`                              | Title, cover, description, curriculum outline. A description edit landing within the hour is invisible. Enrollment, price gating and lesson progress are excluded and stream dynamically.                                                                                  |
| Program detail (`programas/[id]`)                                       | `_cache/getPublicProgram.ts`             | `days`    | 1d / 1w             | `program-{id}`                             | Program structure changes on the order of months. A day stale is already over-conservative; `weeks` would be defensible but makes an admin fix feel unshippable.                                                                                                           |
| Guided-project definition (`proyectos-guiados/[id]`)                    | `_cache/getPublicGuidedProject.ts`       | `hours`   | 1h / 1d             | `guided-project-{id}`                      | Objectives and week structure are admin-authored, edited occasionally. The §3 "admin edits twice" failure cannot occur: the dashboard view is out of scope and keeps reading the uncached shared function.                                                                 |
| Public projects list + detail (`/proyectos`, `/proyectos/[id]`)         | `_cache/getProjects.ts`, `getProject.ts` | `minutes` | 1m / 1h             | `projects`, `project-{id}`                 | User-generated. A student who publishes expects to see it. `minutes` is the correct floor: still stale-5m so it stays in the App Shell, whereas `seconds` would drop the whole surface out of the prerender and cost the shell we are building. Backed by `updateTag` (D). |
| Certificates (`certificados`, `certificados/[id]`, `.../programa/[id]`) | —                                        | **none**  | —                   | —                                          | Per-user credentials plus a DB write on GET render.                                                                                                                                                                                                                        |
| Profile, lesson progress, activities, subscription gates                | —                                        | **none**  | —                   | —                                          | Personal or authorization data. Dynamic inside `<Suspense>`.                                                                                                                                                                                                               |

Every wrapper calls `cacheLife()` explicitly. Omitting it silently yields the `default` profile (5m / 15m / never) — a code-review item, not lint-catchable.

### D. `cacheTag` and invalidation

The split in B does most of the work: **enrollment, lesson progress and project submissions are never cached**, so they need no invalidation at all. That is the point of keeping per-user data below the boundary, and it is why the read-your-own-writes surface is much smaller than the proposal implies.

| Mutation                                     | Mechanism                                                                           | Why                                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enroll in course / program                   | **none**                                                                            | Enrollment is per-user and uncached; it streams on the next render. The cached course record carries no enrollment field.                                             |
| Lesson progress, activity submission, grades | **none**                                                                            | Same — uncached per-user data.                                                                                                                                        |
| Student publishes a project                  | `updateTag('projects')` in the publish Server Action                                | Read-your-own-writes: the student is redirected to `/proyectos` immediately after. `revalidateTag` would show them a list without their own project — reads as a bug. |
| Student edits their project                  | `updateTag('project-{id}')`                                                         | Same-request freshness on the surface they just left.                                                                                                                 |
| Educator publishes / edits a course          | `revalidateTag('learning-items')` (already exists) + `revalidateTag('course-{id}')` | The educator is in the dashboard, not the student catalog. Nobody is waiting on the student-side read; stale-while-revalidate is correct and cheaper.                 |
| Admin edits a program / guided project       | `revalidateTag('program-{id}')` / `revalidateTag('guided-project-{id}')`            | Same asymmetry: the author's own view is uncached; only the student surface revalidates.                                                                              |

`updateTag`/`revalidateTag` calls belong in the Server Actions that already perform the mutation. Adding them to `src/server/actions/**` is allowed (see A) — they change no read behavior for the 20 API consumers.

**Open risk:** `'use cache'` defaults to in-memory, per-instance storage (`use cache` docs, persistence note). Whether `updateTag` reliably evicts a sibling Vercel instance's entry is **not verified by this design**. If read-your-own-writes fails in production on `/proyectos`, the fix is one word per wrapper: `'use cache: remote'`.

### E. `<Suspense>` fallback strategy

**Rule:** a fallback reserves the _shape_ of what replaces it. Never `fallback={null}` on an in-scope boundary, never a bare spinner, and **no `loading.tsx`** — `loading.tsx` wraps the whole segment, which pushes the static shell out of the prerender and produces exactly the "`◐` glyph, empty shell" failure the spec rejects.

| Boundary                                                    | Fallback renders                                                                                                                                          | Source                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `/estudiantes` hero                                         | `StudentDetailsSkeleton`                                                                                                                                  | exists                                             |
| `/estudiantes` catalog (new combined boundary, see flaw #3) | `CatalogSkeleton` = `CategoriesSkeleton` + `CourseGridSkeleton count={12}`                                                                                | new composition of existing parts                  |
| `cursos/[id]`                                               | Cached header (title, cover, description) is in the **shell**; the fallback shrinks to `CourseEnrollmentSkeleton` — enrollment CTA + lesson list rows     | new (smaller than today's `CourseDetailsSkeleton`) |
| `clases/[id]`                                               | `LessonSkeleton`                                                                                                                                          | exists                                             |
| `programas/[id]`                                            | `ProgramDetailsSkeleton`                                                                                                                                  | exists                                             |
| `proyectos-guiados/[id]`                                    | Definition cached in the shell; `GuidedProjectProgressSkeleton` for the per-user week/activity column                                                     | new                                                |
| `certificados`                                              | `<h1>Mis Certificados</h1>` + icon stay in the **static shell**; `CertificateGridSkeleton` = 3 cards at the real `min-h-[420px]` in the same grid classes | new                                                |
| `perfil`                                                    | `ProfileSkeleton` — avatar circle, name/email lines, section cards                                                                                        | new                                                |
| `proyectos`, `proyectos/[id]`                               | `ProjectListSkeleton`, `ProjectDetailSkeleton`                                                                                                            | new                                                |
| `SiteHeader`                                                | the real `<Header />` — see F                                                                                                                             | —                                                  |

Five new skeleton components, matching the proposal's ~100-line forecast. Spinners are permitted only where content has no stable shape; nothing in this set qualifies.

### F. `SiteHeader` / root layout

**The proposal understates this.** `usePathname()` at `SiteHeader.tsx:43` is not decoration — it decides whether the header renders **at all** (10 headerless prefixes, `:10-23`). A naive `<Suspense fallback={null}>` makes the shell headerless on every route: the "paints nothing meaningful" failure, on the most visible shared chrome in the app.

**Choice:** `SiteHeader.tsx` becomes a **server** component whose fallback _is_ the header; today's client body moves verbatim into `HeaderRouteGate.tsx`.

```tsx
// src/components/estudiantes/layout/SiteHeader.tsx — server component, no 'use client'
import { Suspense } from 'react';
import { Header } from '~/components/estudiantes/layout/Header';
import { HeaderRouteGate } from './HeaderRouteGate';

export function SiteHeader() {
  return (
    <Suspense fallback={<Header />}>
      <HeaderRouteGate />
    </Suspense>
  );
}
```

`HeaderRouteGate.tsx` = `'use client'` + the current `HEADERLESS_ROUTE_PREFIXES`, `toSegments`, `matchesPrefix` and `usePathname()` logic, unchanged, returning `isHeaderless ? null : <Header />`.

Why the fallback is the header and not a placeholder: on any route whose pathname is known at prerender (every static route) the gate itself prerenders and the fallback is never used — correct header/no-header, zero flash. The fallback carries only where the pathname is unknown: dynamic-param routes and the shared App Shell. Every in-scope estudiantes route is a header route, so the fallback is always the right answer there.

| Option                                                    | Trade-off                                                                                                                                                                                                                                                                                                                                    | Verdict                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `fallback={<Header />}` (chosen)                          | Correct, meaningful shell on 100% of the in-scope surface. Cost: 4 headerless **dynamic** routes (`/agradecimiento-curso/[id]`, `/estudiantes/proyectos/[id]`, dashboard `[id]` routes) paint the header for one frame before it collapses.                                                                                                  | **Chosen**                       |
| `fallback={null}`                                         | Zero flash anywhere, but the header pops in on every dynamic route and the shell is empty chrome. Fails the spec's first-paint bar.                                                                                                                                                                                                          | Rejected                         |
| `fallback={<HeaderPlaceholder />}` (height-reserving box) | No layout shift, but the shell paints an empty bar — still "nothing meaningful".                                                                                                                                                                                                                                                             | Rejected                         |
| Delete the hook; move the decision to route-group layouts | Structurally correct and flash-free everywhere. Requires adding or editing layouts across `dashboard`, `sign-in`, `sign-up`, `user-profile`, `agradecimiento-curso`, `agradecimiento-plan`, `gracias`, `consult`, `test-loading` — 8+ segments the proposal declares out of scope, and only `dashboard` has a `layout.tsx` today (verified). | Rejected — recorded as follow-up |

**Targeted mitigation, conditional on gate C evidence.** Wrap the header in `<div id="site-header">` in the root layout, and for the two segments that matter add a purely static `<style>{'#site-header{display:none}'}</style>` in their own layout: `src/app/estudiantes/proyectos/layout.tsx` (in scope; does not exist today) and `src/app/agradecimiento-curso/layout.tsx` (PayU, in the gate C regression set; does not exist today). A static ancestor's output is part of that route's prerendered shell, so the suppression lands in the same flush as the header — no flash. Apply this **only** if gate C shows a visible flash; otherwise skip and record it.

Root layout: `export const instant = false` removed. `generateMetadata` calls `getMetadataForRoute()` — **not read by this design**; if it reads `headers()` it becomes a shell blocker and must be handled at stage 2.

### G. Sequencing and rollback

Production auto-deploys on push to `main`, so each stage is one commit, independently revertible, and no stage is pushed half-finished.

| #   | Stage                               | Content                                                                                                                                                                                                               | Gate                                                                         | Rollback                                              |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| 0   | **Build health**                    | Delete the 4 dead route dirs + the `<Link>` at `dashboard/admin/cursos/[courseId]/CourseDetail.tsx:874`; move `/v2` `new Date().getFullYear()` (`v2/page.tsx:50`) into a `'use cache'` + `cacheLife('days')` function | `npm run build` green — the measured baseline fails on exactly these 5 paths | `git revert`                                          |
| 1   | **Guardrail**                       | The two `eslint.cli.config.mjs` overrides from A                                                                                                                                                                      | `npm run check`                                                              | delete the overrides                                  |
| 2   | **Restore validation**              | Root `instant = false` removed; `SiteHeader` → server wrapper + `HeaderRouteGate`                                                                                                                                     | build + gate C on `/`, `/dashboard`, `/agradecimiento-curso/[id]`            | 1-line `instant = false` restore                      |
| 3   | **Reference adoption**              | `estudiantes/layout.tsx`, then `programas/[id]` + its `_cache` wrapper. **STOP and review** — this proves the whole pattern on the lowest-risk route                                                                  | build + gate C on `/estudiantes/programas/[id]`                              | re-add `instant = false` to that page                 |
| 4   | **Remaining adoptions**, risk order | `myaccount` → `perfil` → `certificados` → catalog → `cursos/[id]` → `clases/[id]` → `proyectos-guiados/[id]` → `proyectos` + `proyectos/[id]` (public URLs)                                                           | build + gate C per route, incl. logged-out and `educador` paths              | per route: re-add `instant = false` to that page only |
| 5   | **Documented Blocks**               | 3 routes: TODO → reason comment                                                                                                                                                                                       | final grep from proposal §9                                                  | n/a                                                   |
| 6   | **Partial Prefetching**             | `partialPrefetching: true`                                                                                                                                                                                            | gate D dev Insights sweep                                                    | delete the line                                       |
| 7   | **Dependency**                      | `@clerk/ui ~1.28.0`                                                                                                                                                                                                   | gate C on `/sign-in`, `/estudiantes`                                         | `npm i @clerk/ui@~1.27.2`                             |

Stage 1 is new relative to the proposal, and it is placed **before** any wrapper is written so the rule is armed while the risky code is authored, not audited afterwards.

**Cache purge on rollback: not required.** Cache keys include the Build ID, so a redeploy invalidates every `'use cache'` entry. A `revalidateTag` left firing against a tag that no longer exists after a revert is a no-op.

## Data Flow — `cursos/[id]` (representative)

```
  Page (sync)  ──→  <CoursePublicHeader id />        'use cache' + cacheLife('hours')
       │                 key = courseId only          + cacheTag(`course-${id}`)
       │                 title, cover, description
       │
       └──→  <Suspense fallback={<CourseEnrollmentSkeleton/>}>
                  <CourseUserSection params={params} />       ← await params, await auth()
                       getCourseById(courseId, userId)         ← UNCACHED, per-user
                       getLessonsByCourseId(courseId, userId)  ← UNCACHED, per-user
```

## File Changes

| File                                                                                                          | Action | Description                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| `eslint.cli.config.mjs`                                                                                       | Modify | Two `no-restricted-syntax` / `no-restricted-imports` overrides (decision A)    |
| `src/app/estudiantes/_cache/getCatalog.ts`                                                                    | Create | Cached catalog listing, `hours`, tags `learning-items`/`programs`/`categories` |
| `src/app/estudiantes/_cache/getPublicCourse.ts`                                                               | Create | Public course fields only, `hours`, `course-{id}`                              |
| `src/app/estudiantes/_cache/getPublicProgram.ts`                                                              | Create | `days`, `program-{id}`                                                         |
| `src/app/estudiantes/_cache/getPublicGuidedProject.ts`                                                        | Create | `hours`, `guided-project-{id}`                                                 |
| `src/app/estudiantes/_cache/getProjects.ts`                                                                   | Create | `minutes`, `projects` / `project-{id}`                                         |
| `src/components/estudiantes/layout/SiteHeader.tsx`                                                            | Modify | Server component + `<Suspense fallback={<Header/>}>`                           |
| `src/components/estudiantes/layout/HeaderRouteGate.tsx`                                                       | Create | Today's client body, verbatim                                                  |
| `src/app/layout.tsx`                                                                                          | Modify | Remove `instant = false`; wrap header in `<div id="site-header">`              |
| `src/app/v2/page.tsx`                                                                                         | Modify | `getFullYear()` → `'use cache'` + `cacheLife('days')`                          |
| 12 × `src/app/estudiantes/**/page.tsx` + `layout.tsx`                                                         | Modify | Opt-out removed, shape from decision B                                         |
| 3 × Block pages                                                                                               | Modify | TODO comment → reason comment                                                  |
| 5 × skeleton components                                                                                       | Create | Decision E                                                                     |
| `src/server/actions/estudiantes/{getAllLearningItems,programs/getAllPrograms,categories/getAllCategories}.ts` | Modify | **`export` keyword only** on the uncached loader (decision A-bis carve-out)    |
| 4 × `dashboard/**/ver/**` dirs                                                                                | Delete | Dead stubs, no default export                                                  |
| `dashboard/admin/cursos/[courseId]/CourseDetail.tsx`                                                          | Modify | Remove the `<Link>` at `:874`                                                  |
| `next.config.ts`                                                                                              | Modify | `+ partialPrefetching: true`                                                   |
| `package.json`                                                                                                | Modify | `@clerk/ui ~1.28.0`                                                            |

## Testing Strategy

`strict_tdd: false` — no test runner configured. Gates A–D from proposal §9, plus:

| Layer        | What to test                                                   | Approach                                                                                                                 |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Static (new) | No cache directive escapes `_cache/` or enters `src/server/**` | `npm run check` — the stage-1 lint rule; `rg "'use cache'" src/server` returns zero                                      |
| Build        | Every route prerenders, no missing default export              | `npm run build` (`--debug-prerender` reports all blocking routes)                                                        |
| Runtime      | First paint carries real content, not an empty shell           | Integrated Browser pane at `http://localhost:3000`, per route                                                            |
| Auth (new)   | Redirects still fire from inside `<Suspense>`                  | Logged-out `/estudiantes/clases/1` and `/estudiantes/certificados`; `educador` on a non-owned course                     |
| Regression   | Shared modules uncached                                        | `/agradecimiento-curso/[id]`, one `dashboard/**` course route, `/proyectos` logged out, `/estudiantes/certificados/[id]` |

## Threat Matrix

`N/A — no shell command, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.` The four deleted directories are Next.js URL segments, not a routing/dispatch security boundary; their only adversarial case (a surviving inbound link) is covered by the stage-0 `<Link>` removal and the `/ver/` grep in proposal §6.

## Verification Provenance

**Verified myself, from source read in this phase:** `src/app/layout.tsx`; `SiteHeader.tsx` (full); `estudiantes/clases/[id]/page.tsx` (full); `estudiantes/certificados/page.tsx` (full); `estudiantes/programas/[id]/page.tsx` (full); `estudiantes/page.tsx:1-167`; `estudiantes/cursos/[id]/page.tsx:120-210`; `getCourseById` signature (`:62-65`); `getAllLearningItems:243-252`; the `unstable_cache` grep (5 sites); the existing skeleton inventory (4 components); absence of any `_*` folder under `src/app`; absence of `layout.tsx` for `proyectos`, `estudiantes/proyectos`, `agradecimiento-curso`; `cacheLife` preset table and prerendering thresholds from the bundled docs; the `unstable_cache` → `use cache` migration text from the bundled docs.

**Taken on trust from `explore.md` / the orchestrator:** the four dead stubs' contents and the measured baseline build failure; the three Block routes' internals; the `proyectos` real files; `perfil/page.tsx`; the `ncu` single-update result; the "20 API consumers" count; `getMetadataForRoute()` internals; `Header` internals; `CourseDetail.tsx:874`; `v2/page.tsx:50`.

## Corrections to the Proposal

1. **`unstable_cache` prior art is undeclared** (A-bis) — the largest gap. `explore.md` §1 lists `dynamic`/`revalidate`/`fetchCache` as clean but never greps `unstable_cache`; three catalog functions use it.
2. **"Cache only the public course record" is not achievable by wrapping `getCourseById`.** Its signature is `(courseId, userId = null)` and the returned `Course` carries per-user enrollment. Design: `getPublicCourse(id)` calls `getCourseById(courseId)` with `userId` omitted (the anonymous view) and narrows the return with `Pick<…>`. Cost: one extra query on the dynamic path. Accepted.
3. **"Forward the promise into the 3 existing Suspense sections" does not work on `/estudiantes`.** `const view = params?.view` at `:138` gates the JSX of two of the three sections. A new `CatalogSections` child must own the `!view` branch, which merges two boundaries into one (reflected in E).
4. **`estudiantes/page.tsx` `PageProps` types `searchParams` as `Promise<SearchParams> | SearchParams`** with a dead `instanceof Promise` branch at `:136-137`. Narrow to `Promise<SearchParams>`; the union is what forces the top-level await.
5. **`SiteHeader`'s `usePathname()` is a render gate, not decoration** — "wrap it in `<Suspense>`" is underspecified and the obvious reading (`fallback={null}`) fails the spec bar. See F.
6. **`programas/[id]/generateMetadata:48-51` uses `fetch(..., { next: { revalidate: 3600 } })`** — same class of undeclared prior art as #1. Not a build blocker (fetch caching survives as a separate layer). Record; do not fix here.
7. **Non-issue, flagged so apply does not "fix" it:** `certificados/page.tsx:133,219` calls `new Date(certificate.createdAt).toLocaleDateString()` — derived from row data, not sync IO, and inside the dynamic region.

## Migration / Rollout

No data migration, no schema change, no external service touched. Rollout is the stage table in G; rollback is per-stage `git revert` plus the per-route `instant = false` restore.

## Open Questions

- [ ] Are the uncached loaders behind `getAllLearningItems` / `getAllPrograms` / `getAllCategories` separable with an `export`-only edit? If not, the catalog stays uncached (Suspense-only) — decide at stage 4, do not improvise.
- [ ] Does `getMetadataForRoute()` read `headers()`? If yes it is a root-layout shell blocker and stage 2 grows.
- [ ] Does `updateTag` evict in-memory `'use cache'` entries across Vercel instances? If read-your-own-writes fails on `/proyectos`, switch those two wrappers to `'use cache: remote'`.
- [ ] Apply the `#site-header` static suppression to `estudiantes/proyectos` and `agradecimiento-curso`, or accept a one-frame header flash there? Decide from gate C evidence, not in advance.
