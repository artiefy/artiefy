# Proposal: Instant Navigation for the Student Area

- **Phase:** `sdd-propose` · **Artifact store:** hybrid · **Delivery:** single-pr · **Review budget:** 800 lines
- **Input:** `openspec/changes/estudiantes-instant-navigation/explore.md`
- **Baseline:** commit `c1ba0749` already landed `cacheComponents: true`, `force-dynamic` removal from 42 API routes, and the `instant = false` codemod. None of that is re-planned here.

## 1. Problem Statement

Students use `/estudiantes` as a browsing surface, not a single destination. A typical session is a chain of navigations: catalog → course detail → lesson → back to catalog → program → certificates. Every one of those hops currently pays a full server round trip before anything paints, because no route in the tree has a prerenderable shell — `'use cache'` appears **zero** times repo-wide and all 15 student segments carry `export const instant = false`.

Three concrete costs:

1. **Course discovery feels slow.** The catalog and course-detail pages show almost entirely public, slow-changing content (titles, covers, descriptions, curriculum outlines), yet none of it is cached or prerendered. Students on mobile networks stare at a blank frame for content that has not changed in hours.
2. **Lesson entry blocks on the whole page.** `clases/[id]` awaits `params` and `auth()` at the top of the page body, so the shared chrome cannot paint until per-user progress resolves. The part that must be fresh (progress) delays the part that never changes (the shell).
3. **Validation is currently switched off.** `src/app/layout.tsx` carries `instant = false`. While it stays, `next build` cannot tell us whether any student route is instant — the whole tree is exempt. We have no regression signal at all.

The preparation commit made the app buildable under Cache Components. It did not make a single route faster. This change is where the student area actually gets the benefit, and where build-time validation is restored so it stays.

**Why now:** the flag is already on and the codemod TODOs are the work queue. Leaving 40 opt-outs in place indefinitely means carrying the migration cost without the payoff, and every new student route added meanwhile inherits the wrong pattern.

## 2. Scope

### In scope — file granularity

| Path                                                                              | Action                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app/layout.tsx`                                                              | Remove `export const instant = false` (decision #2) — restores build-time validation |
| `src/components/.../SiteHeader.tsx` (`usePathname` at `:43`)                      | Wrap the pathname read in `<Suspense>`                                               |
| `src/app/estudiantes/layout.tsx`                                                  | Remove opt-out                                                                       |
| `src/app/estudiantes/page.tsx`                                                    | Push `searchParams` promise into Suspense children; cache catalog at call-site       |
| `src/app/estudiantes/cursos/[id]/page.tsx`                                        | Stop awaiting `params` before the boundary; cache course detail at call-site         |
| `src/app/estudiantes/clases/[id]/page.tsx`                                        | Push `params` + `auth()` into the Suspense child                                     |
| `src/app/estudiantes/programas/[id]/page.tsx`                                     | Add local cached wrapper (already the model Suspense shape)                          |
| `src/app/estudiantes/proyectos-guiados/[id]/page.tsx`                             | Push `params` into the boundary                                                      |
| `src/app/estudiantes/certificados/page.tsx`                                       | Wrap per-user query in `<Suspense>` (dynamic, uncached)                              |
| `src/app/estudiantes/perfil/page.tsx`                                             | Wrap profile reads in `<Suspense>` (dynamic, uncached)                               |
| `src/app/estudiantes/myaccount/page.tsx`                                          | Remove opt-out (no blocking read)                                                    |
| `src/app/estudiantes/proyectos/page.tsx` + `src/app/proyectos/page.tsx`           | Shim + real file (decision #1)                                                       |
| `src/app/estudiantes/proyectos/[id]/page.tsx` + `src/app/proyectos/[id]/page.tsx` | Shim + real file (decision #1)                                                       |
| `src/app/estudiantes/certificados/[id]/page.tsx`                                  | Keep `instant = false`; rewrite TODO into a documented Block reason                  |
| `src/app/estudiantes/certificados/programa/[id]/page.tsx`                         | Same — documented Block                                                              |
| `src/app/estudiantes/proyectos-guiados/[id]/actividades/[activityId]/page.tsx`    | Same — documented Block                                                              |
| 4 dead dashboard stubs (see §6)                                                   | Resolve so `next build` can run at all                                               |
| `next.config.ts`                                                                  | Add `partialPrefetching: true` (after Cache Components lands)                        |
| `package.json`                                                                    | `@clerk/ui ~1.27.2 → ~1.28.0` — the only available update repo-wide                  |
| New: local cache wrappers under `src/app/estudiantes/_cache/`                     | Estudiantes-only `'use cache'` call-site wrappers                                    |

`src/app/estudiantes/foro/[forumId]/page.tsx` is `'use client'` — it never received an opt-out and needs no change.

**Cross-boundary note (decision #1):** `src/app/proyectos/page.tsx` and `src/app/proyectos/[id]/page.tsx` also serve the **public `/proyectos` and `/proyectos/[id]` URLs**. Editing them changes behavior for logged-out visitors, not just students. Both URLs are in the verification set.

### Out of scope — explicitly not touched

- **PayU payment flows** — `src/app/api/confirmPayment/**`, `confirmCoursePayment/**`, `super-admin/enroll_user_program/programsUser/pagos/**`.
- **`src/app/agradecimiento-curso/**`** — the PayU thank-you page (a `getCourseById` consumer; this is exactly why the §3 rule exists).
- **Roles and permissions** — no Clerk role check, `auth()` gate, or middleware rule is added, removed, moved across a trust boundary, or weakened. Reads move inside `<Suspense>`; they are never skipped.
- **Personal-data handling** — no personal data enters a cache. See §3.
- **Every `dashboard/**` segment** beyond the 4 dead stubs — the admin, super-admin, and educator trees keep their opt-outs untouched.
- **All of `src/app/api/**`** — 42 route handlers, cron jobs, and webhooks. No route handler is edited.
- **`src/server/**` shared modules** — read for understanding, never annotated. See §3.
- Dependency upgrades beyond `@clerk/ui`; static-shell growth (`next-cache-components-optimizer`); `@next/playwright` `instant()` regression tests; runtime prefetching (`TODO(runtime-prefetch)` step 5).

## 3. The Non-Negotiable Caching Rule

> **Never place `'use cache'` inside a shared module.** Cache at the estudiantes call-site, in a local wrapper function.

Forbidden targets — no `'use cache'`, `cacheLife`, or `cacheTag` may be added inside any of these:

| Shared module                    | Also consumed by                                                                           | Blast radius if cached                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getCourseById`                  | `agradecimiento-curso/[id]` (PayU) + 3 `api/**` routes                                     | A student who just paid sees a stale "not enrolled" thank-you page and opens a support ticket. Payment webhooks read stale enrollment state.                     |
| `getGuidedProjectById`           | `dashboard/super-admin/(inicio)/proyectos-guiados/[projectId]`                             | An admin edits a project and the admin view still shows the old version — they edit again, producing duplicate or conflicting writes.                            |
| `isCourseOwnedByEducator`        | `src/server/services/forums/courseForumAccess.ts`                                          | **Authorization decision cached.** A revoked educator keeps forum-moderation access until the cache expires. This is a security regression, not a staleness bug. |
| `~/server/actions/estudiantes/*` | 20 files under `src/app/api/**` — cron, webhooks, `confirmPayment`, `confirmCoursePayment` | Cron jobs and payment webhooks act on stale reads. Failures are silent and asynchronous, surfacing hours later as wrong enrollment or subscription state.        |

**Mechanism:** an estudiantes page imports a thin local wrapper (`src/app/estudiantes/_cache/*.ts`) that carries the `'use cache'` directive and calls the untouched shared function. The shared module's other 25+ consumers keep exact current behavior. Any diff hunk that adds a cache directive to a file under `src/server/**` is a review blocker.

**Second rule, personal data:** nothing gated on `auth()`, `currentUser()`, subscription state, grades, certificates, or profile fields is cached — not even with `'use cache: private'`. Those reads go inside `<Suspense>` and stay dynamic.

## 4. Per-Segment Plan (15 segments)

Buckets from the exploration: (a) already instant · (b) needs `use cache` · (c) needs `<Suspense>` · (d) push `params`/`searchParams` into `<Suspense>` · (e) genuinely dynamic.

| #   | Segment                                           | Bucket | Decision                            | Why                                                                                                                                                                                                   |
| --- | ------------------------------------------------- | ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `layout.tsx`                                      | a      | **Adopt** — remove opt-out          | No blocking read. Must go first: the highest opt-out shadows everything below it.                                                                                                                     |
| 2   | `page.tsx` (catalog)                              | d      | **Adopt + cache**                   | `await searchParams` at `:136` blocks. Forward the promise into the 3 existing Suspense sections; cache the filter-independent catalog listing. Highest-traffic student surface.                      |
| 3   | `foro/[forumId]`                                  | a      | **No change**                       | `'use client'` — cannot export `instant`, never had one.                                                                                                                                              |
| 4   | `certificados/[id]`                               | e      | **Stay dynamic** (documented Block) | Performs a **DB write during a GET render** (certificate issuance). Caching or re-running a prerender would duplicate or skip a credential write. Rewrite the TODO into a reason comment.             |
| 5   | `clases/[id]`                                     | d      | **Adopt, uncached**                 | `params` + `auth()` at `:54`/`:60` outside the existing `LessonContent` boundary. Push both in. Lesson progress is per-user — dynamic, never cached.                                                  |
| 6   | `cursos/[id]`                                     | d      | **Adopt + cache**                   | `await Promise.resolve(params)` at `:137` blocks. `CourseContent` already reads `auth()` inside the boundary correctly. Cache only the public course record; enrollment stays dynamic.                |
| 7   | `programas/[id]`                                  | b      | **Adopt + cache**                   | Already forwards the promise to its Suspense child — the model pattern. Only needs the local cached wrapper. Lowest-risk adoption; do it first as the reference implementation.                       |
| 8   | `proyectos/[id]` (+ real file)                    | c/d    | **Adopt + cache**                   | Real file at `~/app/proyectos/[id]`. Also serves the public URL.                                                                                                                                      |
| 9   | `proyectos-guiados/[id]`                          | d      | **Adopt + cache**                   | `params` at top. Project definition is cacheable; per-user progress is not.                                                                                                                           |
| 10  | `certificados/page.tsx`                           | c/e    | **Adopt, uncached**                 | `auth()` + `db.query.certificates.findMany` at `:26`/`:34` with no boundary. Wrap in `<Suspense>` so the chrome paints. **Never cached** — per-user credentials.                                      |
| 11  | `myaccount`                                       | a      | **Adopt** — remove opt-out          | Client-side Clerk gating via `<Show>`; nothing blocks.                                                                                                                                                |
| 12  | `perfil`                                          | c      | **Adopt, uncached**                 | `getMyProfile` + `Promise.all(...)` direct. Wrap in `<Suspense>`. Personal data — never cached.                                                                                                       |
| 13  | `proyectos/page.tsx` (+ real file)                | c/d    | **Adopt + cache**                   | Real file reads `searchParams` + `auth()` unguarded. Also serves the public URL.                                                                                                                      |
| 14  | `proyectos-guiados/[id]/actividades/[activityId]` | e      | **Stay dynamic** (documented Block) | Gates on **subscription state** with a `Date` comparison. Payment-adjacent authorization; a cached or prerendered gate could grant access to an expired subscriber. Not worth the risk for one route. |
| 15  | `certificados/programa/[id]`                      | e      | **Stay dynamic** (documented Block) | Same DB-write-on-GET shape as #4.                                                                                                                                                                     |

**Justification for the three Blocks:** each one either writes to the database during a GET render (#4, #15) or makes an authorization decision from time-sensitive subscription state (#14). Prerendering a shell for these means either duplicating a write or evaluating a gate at build time. The performance gain does not justify a correctness or access-control risk on the routes that issue credentials and enforce paid access. Each keeps `instant = false` with the codemod TODO replaced by a reason comment, per the adoption skill's "deliberate Block" convention.

## 5. `cacheLife` Profiles

| Cached surface                                               | Profile                | Tag                        | Reasoning                                                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Course catalog listing (#2)                                  | `cacheLife('hours')`   | `courses`                  | Changes only when an educator publishes. An hour of staleness on a browse listing is invisible to students; a newly published course appearing within the hour is acceptable. Tagged so a publish action can `revalidateTag` for immediacy. |
| Course detail — public fields only (#6)                      | `cacheLife('hours')`   | `course-{id}`              | Title, description, cover, curriculum outline. Same publish cadence as the catalog. Enrollment status, progress, and price gating are **excluded** and stream in dynamically.                                                               |
| Program detail (#7)                                          | `cacheLife('days')`    | `program-{id}`             | Program structure (name, included courses, duration) changes on the order of months. A day of staleness is over-conservative and still safe.                                                                                                |
| Guided-project definition (#9)                               | `cacheLife('hours')`   | `guided-project-{id}`      | Objectives and week structure are authored content edited occasionally by admins. Per-user activity progress is **not** in this cache.                                                                                                      |
| Public projects list + detail (#8, #13)                      | `cacheLife('minutes')` | `projects`, `project-{id}` | User-generated content. A student who publishes a project expects to see it in the list almost immediately; a multi-hour window would read as a bug.                                                                                        |
| **Certificates** (#4, #10, #15)                              | **none**               | —                          | Per-user credentials, plus a write-on-render. Explicitly uncached at any profile.                                                                                                                                                           |
| **Profile, lesson progress, activities, subscription gates** | **none**               | —                          | Personal or authorization data. Dynamic inside `<Suspense>`.                                                                                                                                                                                |

The three tiers map to how the underlying data actually changes: authored-and-published (`hours`), structural (`days`), user-generated (`minutes`). Certificates and per-user state get no tier at all.

## 6. Blocker — Four Dead Dashboard Stubs

These four files now contain **only** `export const instant = false` and the codemod TODO. They have **no `export default`**, which `next build` rejects. They were already 100% commented out before commit `c1ba0749`, so this is pre-existing dead code, not a regression from the preparation work — but decision #2 makes a passing `next build` the point of this change, so they sit on the critical path.

- `src/app/dashboard/admin/cursos/[courseId]/ver/[cursoId]/page.tsx`
- `src/app/dashboard/admin/cursos/[courseId]/ver/[cursoId]/clase/[claseId]/page.tsx`
- `src/app/dashboard/super-admin/(inicio)/cursos/[courseId]/ver/[cursoId]/page.tsx`
- `src/app/dashboard/super-admin/(inicio)/cursos/[courseId]/ver/[cursoId]/clase/[claseId]/page.tsx`

| Option                                 | Effect                                                 | Trade-off                                                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — delete the 4 route directories** | Smallest diff (−12 lines), removes genuinely dead code | **Removes 4 URLs.** Any surviving `<Link>` or `router.push` to `/dashboard/**/ver/**` becomes a 404. This is a product decision — the user must confirm the routes are truly retired. |
| **B — minimal placeholder component**  | Keeps the URLs alive, build goes green (~+20 lines)    | Ships four routes that render nothing meaningful. Dead code stays, disguised as live code, and the real cleanup is deferred.                                                          |

**Recommendation:** A, conditional on an inbound-link grep for `/ver/` targets returning empty. If any inbound link exists, B for those specific routes only.

**Open item to confirm:** a baseline `npm run build` is in flight. If it fails on these four files, resolving them is a hard prerequisite task ordered before any estudiantes work. If it somehow passes, the resolution still belongs in this change but drops off the critical path. This proposal holds either way; `sdd-tasks` must read the baseline result before ordering.

## 7. Approach and Sequencing

**Stage 0 — unblock.** Resolve the 4 dead stubs (§6). Establish a green `npm run build` baseline.

**Stage 1 — restore validation.** Remove `instant = false` from `src/app/layout.tsx`; wrap `SiteHeader`'s `usePathname()` in `<Suspense>`. The adoption skill flags this exact shape as the most common shell blocker: a client hook in the root nav blocks **every dynamic route** with `blocking-prerender-client-hook`, while static routes pass and mask it. Removing the root opt-out before this fix will surface errors across the whole app — expected, and the reason this stage is isolated. Descendant segments keep their own opt-outs and stay passing.

**Stage 2 — adopt, top-down, one surface at a time.** `estudiantes/layout.tsx` first (the highest opt-out shadows everything below), then `programas/[id]` as the reference implementation (it already has the correct Suspense shape), then the remaining segments per §4. Cache wrappers land in `src/app/estudiantes/_cache/` — never in `src/server/**`.

**Stage 3 — Partial Prefetching.** Add `partialPrefetching: true` to `next.config.ts`.

**Stage 4 — dependency bump.** `@clerk/ui ~1.27.2 → ~1.28.0`, isolated at the end so a UI regression is attributable.

**Why Cache Components before Partial Prefetching:**

1. `partialPrefetching` **requires** `cacheComponents` — it is a hard dependency, not a preference.
2. Partial Prefetching warms the shared App Shell. Cache Components adoption is what _creates_ that shell. Enabling prefetching first would warm empty shells and deliver no benefit.
3. Its insights are dev-only and are **replaced on any route that still has a `blocking-prerender-*` error**. Running the prefetch sweep against unadopted routes produces a silent, misleading pass.
4. The step-1 audit is empty here — **zero** `<Link prefetch={true}>` and **zero** `router.prefetch()` calls repo-wide (only 4 × `prefetch={false}` in `MyCoursesContent.tsx`). With no legacy full-prefetch links to preserve, stage 3 is a one-line config change plus a dev sweep. That cheapness is precisely why it goes last: it costs nothing to defer and everything to rush.

## 8. Capabilities

### New Capabilities

- `estudiantes-instant-navigation`: prerendered static shells and streamed dynamic content across the student area — which surfaces are cached, at what freshness, and which stay dynamic and why.

### Modified Capabilities

- None. The existing `openspec/specs/estudiantes/spec.md` (Guided Projects) describes data models and business rules that this change does not alter. Rendering strategy changes; requirements do not.

## 9. Verification Strategy

`strict_tdd: false` — no test runner is configured, and `openspec/config.yaml` has empty `test_command` for both apply and verify. Verification is build + typecheck + per-route dev inspection.

| Gate | Command / surface                                                                                                                 | When                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| A    | `npm run build` (already passes `--debug-prerender`, so it reports **every** blocking route, not just the first)                  | After stage 0; after stage 1; after each stage-2 surface; final |
| B    | `npm run check` (ESLint `--max-warnings=0` + `tsc`)                                                                               | Before commit, per repo policy                                  |
| C    | `next dev` + integrated browser (Claude Code Browser pane, `http://localhost:3000`), reading the dev overlay and MCP `get_errors` | Per route, after each adoption                                  |
| D    | `next dev` overlay **Insights** tab + dev-server log (`Next.js encountered … data` lines)                                         | After stage 3 only                                              |

Routes checked in gate C — **adopted:** `/estudiantes`, `/estudiantes/cursos/[id]`, `/estudiantes/clases/[id]`, `/estudiantes/programas/[id]`, `/estudiantes/proyectos-guiados/[id]`, `/estudiantes/certificados`, `/estudiantes/perfil`, `/estudiantes/myaccount`, `/estudiantes/proyectos`, `/estudiantes/proyectos/[id]`.

**Regression set — must be checked even though they are out of scope for edits:**

- `/` and one other public route — proves the `SiteHeader` Suspense fix did not break the shared shell.
- `/proyectos` and `/proyectos/[id]` — the public URLs sharing the edited real files (decision #1).
- `/agradecimiento-curso/[id]` and one `dashboard/**` course route — proves no `getCourseById` / `getGuidedProjectById` cache leaked into a shared module. This is the §3 rule's runtime check.
- `/estudiantes/certificados/[id]` — proves the documented Block still renders and still writes.

**Per-route bar** (adoption skill): overlay clean **and** the build passes **and** the browser shows real content in the first paint — not an empty shell with everything streaming behind a fallback. A `◐ (Partial Prerender)` glyph confirms a shell exists, not what is in it. If a `<Suspense>` boundary sits too high the build still reports `◐` while the shell is effectively empty; only the browser catches that.

**Final grep:** `rg "TODO: Cache Components adoption" src/app/estudiantes` must return only the three documented Blocks (#4, #14, #15), each with the TODO rewritten into a reason.

## 10. Changed-Line Forecast vs the 800-Line Budget

| Work unit                                                                                                | Est. authored lines (add + del) |
| -------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Stage 0 — 4 dead stubs (option A)                                                                        | ~12                             |
| Stage 1 — root layout + `SiteHeader` Suspense                                                            | ~15                             |
| Trivial opt-out removals (estudiantes layout, myaccount, 2 shims)                                        | ~16                             |
| 9 non-trivial segment adoptions (~50 each)                                                               | ~450                            |
| New `_cache/` wrapper modules (3 files)                                                                  | ~75                             |
| New Suspense fallback / skeleton components (~5)                                                         | ~100                            |
| 3 documented Blocks — TODO → reason comment                                                              | ~12                             |
| Stage 3 — `partialPrefetching: true`                                                                     | ~1                              |
| Stage 4 — `@clerk/ui` bump (lockfile is generated, excluded from authored count)                         | ~2                              |
| **Central estimate**                                                                                     | **~680**                        |
| **Upper bound** (option B for the stubs, more skeletons than forecast, extra boundaries surfaced in dev) | **~850**                        |

`400-line budget risk (against the raised 800 budget): Medium-High`

**Plain statement:** the central estimate (~680) fits inside 800, but the upper bound (~850) does not, and the estimate has real variance — Suspense fallback components are the least predictable line item, since the dev loop routinely surfaces boundaries that only become visible once a route is unblocked. **If the forecast is exceeded during `sdd-tasks` or `sdd-apply`, the user decides between splitting and accepting a size exception.** This proposal does not assume either.

**If splitting is chosen,** the natural boundary is already the stage sequence, and each slice stands alone:

- **PR 1** — stages 0 + 1: dead stubs + root layout + `SiteHeader`. ~30 lines. Restores build-time validation, ships independently, trivially revertible.
- **PR 2** — stage 2: the estudiantes adoptions. ~650 lines. The bulk.
- **PR 3** — stages 3 + 4: `partialPrefetching` + `@clerk/ui`. ~5 lines.

## 11. Affected Areas

| Area                               | Impact              | Description                                                              |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `src/app/estudiantes/**`           | Modified            | 12 segments adopted, 3 kept as documented Blocks                         |
| `src/app/estudiantes/_cache/**`    | New                 | Estudiantes-only `'use cache'` call-site wrappers                        |
| `src/app/layout.tsx`               | Modified            | Opt-out removed — restores build validation app-wide                     |
| `src/components/**/SiteHeader.tsx` | Modified            | `usePathname()` wrapped in `<Suspense>`                                  |
| `src/app/proyectos/**`             | Modified            | Real files behind the estudiantes shims; **also serves the public URLs** |
| `src/app/dashboard/**` (4 stubs)   | Removed or Modified | Dead routes resolved so the build can run                                |
| `next.config.ts`                   | Modified            | `+ partialPrefetching: true`                                             |
| `package.json`                     | Modified            | `@clerk/ui` minor bump                                                   |
| `src/server/**`                    | **Untouched**       | Read for understanding only — the §3 rule forbids edits                  |

## 12. Risks

| Severity   | Risk                                                                                                                                            | Likelihood      | Mitigation                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **HIGH**   | `'use cache'` leaks into a shared module, staling the PayU thank-you page, an admin view, or an authorization check (`isCourseOwnedByEducator`) | Medium          | §3 rule; wrappers live only in `src/app/estudiantes/_cache/`; any cache directive under `src/server/**` is a review blocker; gate C regression set covers `/agradecimiento-curso/[id]` and a dashboard route |
| **HIGH**   | Removing the root-layout opt-out surfaces blocking errors app-wide, far beyond estudiantes                                                      | High (expected) | Isolated as stage 1 with the `SiteHeader` fix; descendant opt-outs still shadow their own subtrees; revert is a 1-line restore                                                                               |
| **HIGH**   | `next build` currently fails on the 4 dead stubs, blocking every gate                                                                           | High            | Stage 0 resolves it first; **open item — baseline build result must be read before `sdd-tasks` orders the work**                                                                                             |
| **MEDIUM** | Deleting the 4 dashboard route directories 404s a live inbound link                                                                             | Medium          | Inbound-link grep before deletion; fall back to option B per route; **user confirmation required — this is a product decision**                                                                              |
| **MEDIUM** | `proyectos` edits regress the **public** `/proyectos` URLs for logged-out visitors                                                              | Medium          | Both public URLs are in the gate C regression set; logged-out state checked explicitly                                                                                                                       |
| **MEDIUM** | A `<Suspense>` boundary placed too high yields an empty shell that still builds `◐`                                                             | Medium          | Browser first-paint check is part of the per-route bar; the build glyph alone is not accepted as proof                                                                                                       |
| **MEDIUM** | Changed lines exceed the 800 budget                                                                                                             | Medium          | Forecast in §10 with a pre-agreed 3-PR split; escalate to the user rather than silently overrunning                                                                                                          |
| **LOW**    | `@clerk/ui` minor bump regresses auth UI                                                                                                        | Low             | Isolated as the last stage; visually verified in the integrated browser                                                                                                                                      |
| **LOW**    | No test runner means no CI regression guard for instant navigation                                                                              | Certain         | Documented; `@next/playwright` `instant()` tests recommended as follow-up work, explicitly out of scope here                                                                                                 |

## 13. Rollback Plan

1. **Whole change:** `git revert` the commit(s). No schema migration, no data change, no external service touched — the revert is complete and safe.
2. **Single route:** re-add `export const instant = false` to that `page.tsx`. Restores pre-change behavior for that segment only; the rest keeps the improvement.
3. **Partial Prefetching only:** delete `partialPrefetching: true` from `next.config.ts`. Zero source changes needed — the flag is independent of the Cache Components work.
4. **Root-layout validation only:** restore `export const instant = false` in `src/app/layout.tsx`. Suppresses validation app-wide again without reverting any adoption.
5. **Cache purge:** not required. Cache keys include the Build ID, so a redeploy invalidates every `'use cache'` entry automatically. No manual cache flush, no Redis intervention.
6. **Dependency:** `npm install @clerk/ui@~1.27.2` to pin back.

## 14. Dependencies

- Baseline `npm run build` result (in flight) — determines whether §6 is a hard prerequisite. **Blocking for `sdd-tasks` ordering.**
- User confirmation on §6 option A vs B — deleting a route removes a URL.
- A runnable dev environment with real credentials (Clerk, Neon, S3): both adoption skills verify against a booting app, and `src/env.ts` throws on missing env at import.
- Next.js ≥ 16.3 — satisfied (16.3.0).
- `cacheComponents: true` — satisfied (`next.config.ts:32`).

## 15. Success Criteria

- [ ] `npm run build` completes with no blocking-route errors and no missing-default-export failures.
- [ ] `npm run check` passes (ESLint `--max-warnings=0` + `tsc`).
- [ ] `src/app/layout.tsx` no longer exports `instant = false` — build-time instant validation is active for the whole tree.
- [ ] 12 of 15 estudiantes segments have their opt-out removed; the remaining 3 carry a reason comment, not a codemod TODO.
- [ ] `rg "'use cache'" src/server` returns **zero** matches.
- [ ] No cached surface contains data gated on `auth()`, `currentUser()`, subscription state, grades, certificates, or profile fields.
- [ ] Each adopted route shows meaningful content in the first paint in the browser — not an empty shell.
- [ ] Regression set clean: `/`, `/proyectos`, `/proyectos/[id]`, `/agradecimiento-curso/[id]`, one `dashboard/**` course route, `/estudiantes/certificados/[id]`.
- [ ] `partialPrefetching: true` is set and the dev Insights sweep across the student routes is clean.
- [ ] `@clerk/ui` at `~1.28.0`; `npx npm-check-updates` reports no remaining updates.

## 16. Proposal Question Round

Execution mode is `auto`, so these were not asked interactively. Each is a **product** decision the proposal has assumed a default for — correct any that is wrong before `sdd-spec` and `sdd-design`.

1. **Dead dashboard routes (§6).** Are `/dashboard/admin/cursos/[courseId]/ver/[cursoId]` and the three sibling routes genuinely retired, or is someone still expected to reach them? _Assumed: retired — delete them (option A), conditional on no inbound links._
2. **Public `/proyectos` blast radius (§2).** Editing the real files behind the estudiantes shims changes the public, logged-out `/proyectos` experience too. _Assumed: acceptable — same code, same intended behavior, verified logged-out in gate C._
3. **Catalog freshness (§5).** When an educator publishes a course, how fast must it appear in the student catalog? _Assumed: within the hour is fine (`cacheLife('hours')` + a `courses` tag for immediate invalidation if a publish action is later wired to `revalidateTag`)._
4. **Project visibility (§5).** When a student publishes a project, is a few minutes' delay before it appears in `/proyectos` acceptable? _Assumed: yes — `cacheLife('minutes')`. If it must be instant, that surface stays uncached._
5. **Size (§10).** If the work exceeds 800 changed lines, split into the 3 PRs in §10 or accept a size exception on a single PR? _Assumed: escalate and ask — not silently decided._
