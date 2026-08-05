# Estudiantes Instant Navigation Specification

## Purpose

Defines the rendering/caching contract for `src/app/estudiantes/**` under Cache Components: which segments MUST prerender an instant static shell, which stay dynamic, the hard prohibition on caching inside shared modules, `cacheLife`/`cacheTag` correctness, Partial Prefetching, and the no-regression surface. This is a NEW capability — it does not modify `openspec/specs/estudiantes/spec.md` (Guided Projects data model/business rules are unchanged; only rendering strategy changes).

## Requirements

### Requirement: Build Health

`npm run build` MUST complete with zero export/prerender errors. Baseline (before): 5 failing paths — 4 `The default export is not a React Component` (dead dashboard stubs) + 1 `unstable value new Date()` (`/v2`).

#### Scenario: Clean production build

- GIVEN the 4 dead dashboard route directories are deleted (`src/app/dashboard/admin/cursos/[courseId]/ver/`, `src/app/dashboard/super-admin/(inicio)/cursos/[courseId]/ver/`) and `/v2`'s year is moved into a `'use cache'` function with `cacheLife('days')`
- WHEN `npm run build` runs
- THEN it exits 0 with no `Export encountered errors` block
- AND `rg -l "ver/\[cursoId\]" src/app/dashboard` returns no matches

#### Scenario: Root validation restored

- GIVEN `export const instant = false` is removed from `src/app/layout.tsx` and `SiteHeader.tsx`'s `usePathname()` (`:43`) is wrapped in `<Suspense>`
- WHEN `npm run build` runs
- THEN no route reports `blocking-prerender-client-hook` caused by `SiteHeader`
- AND `rg "instant = false" src/app/layout.tsx` returns no matches

#### Scenario: Dead dashboard link removed

- GIVEN `CourseDetail.tsx:874` previously linked to a deleted `ver/` route
- WHEN the file is inspected
- THEN `rg "\./\\\$\{course.id\}/ver/" src/app/dashboard/admin/cursos/[courseId]/CourseDetail.tsx` returns no matches

### Requirement: Adopted Segment Shells

Each of the 12 adopted segments below MUST prerender a static shell containing real, meaningful content (not an empty skeleton behind every fallback) and MUST push per-request/per-user reads (`params`, `searchParams`, `auth()`) into a `<Suspense>` boundary.

| #   | Segment                                         | Shell MUST contain                                     | Stays dynamic                              |
| --- | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| 1   | `layout.tsx`                                    | Full chrome                                            | —                                          |
| 2   | `page.tsx` (catalog)                            | Catalog listing (cached)                               | Filter results from `searchParams`         |
| 6   | `cursos/[id]`                                   | Title, description, cover, curriculum outline (cached) | Enrollment/progress/price                  |
| 5   | `clases/[id]`                                   | Shared lesson chrome                                   | `params` + `auth()` progress               |
| 7   | `programas/[id]`                                | Program structure (cached)                             | none extra                                 |
| 8   | `proyectos/[id]` (+ `~/app/proyectos/[id]`)     | Project detail (cached)                                | Auth-gated actions                         |
| 9   | `proyectos-guiados/[id]`                        | Objectives/week structure (cached)                     | Per-user activity progress                 |
| 10  | `certificados/page.tsx`                         | Page chrome                                            | `auth()` + certificate list (never cached) |
| 11  | `myaccount`                                     | Full content, no opt-out                               | Client-side Clerk `<Show>`                 |
| 12  | `perfil`                                        | Page chrome                                            | Profile reads (never cached)               |
| 13  | `proyectos/page.tsx` (+ `~/app/proyectos/page`) | Project list (cached)                                  | `searchParams` + `auth()`                  |
| —   | `foro/[forumId]`                                | N/A — `'use client'`, unchanged                        | N/A                                        |

#### Scenario: Shell renders real content, not an empty fallback

- GIVEN an adopted route is requested via `next dev`
- WHEN the integrated browser observes first paint
- THEN the shell shows the table's "Shell MUST contain" content directly, with only the "Stays dynamic" content behind a Suspense fallback
- AND a `◐ (Partial Prerender)` build glyph alone is NOT accepted as proof — first-paint content is required

#### Scenario: Opt-out removed

- GIVEN a segment listed above
- WHEN `rg "export const instant" <segment path>` runs
- THEN no match is found (except the 3 documented Blocks below)

### Requirement: Documented Dynamic Blocks

`certificados/[id]`, `certificados/programa/[id]`, and `proyectos-guiados/[id]/actividades/[activityId]` MUST keep `export const instant = false` because each either writes to the database during a GET render (credential issuance) or gates on time-sensitive subscription state.

#### Scenario: Block reason documented, not a TODO

- GIVEN the 3 Block segments
- WHEN `rg "TODO: Cache Components adoption" src/app/estudiantes` runs
- THEN it returns zero matches (each TODO was rewritten into a reason comment)
- AND `rg "export const instant = false" src/app/estudiantes/certificados/\[id\]/page.tsx src/app/estudiantes/certificados/programa/\[id\]/page.tsx "src/app/estudiantes/proyectos-guiados/[id]/actividades/[activityId]/page.tsx"` finds a match in all 3

#### Scenario: Block route still functions

- GIVEN `/estudiantes/certificados/[id]`
- WHEN visited in `next dev` with a valid enrolled user
- THEN the certificate still renders and the write-on-render still occurs (no regression from touching this file)

### Requirement: No `'use cache'` in Shared Modules

No file under `src/server/**` MAY carry `'use cache'`, `cacheLife`, or `cacheTag`. This is a security requirement, not a performance one: caching `isCourseOwnedByEducator` would cache an authorization decision, letting a revoked educator keep forum-moderation access past revocation.

#### Scenario: Shared module grep is clean

- GIVEN the change is complete
- WHEN `rg "'use cache'|cacheLife|cacheTag" src/server` runs
- THEN it returns zero matches

#### Scenario: Authorization check never cached

- GIVEN `isCourseOwnedByEducator` in `src/server/services/forums/courseForumAccess.ts`
- WHEN the file is diffed against its pre-change version
- THEN it is byte-identical (untouched) — any cache directive here is a review blocker

### Requirement: Cache Correctness and Invalidation

Each cached surface MUST use exactly the `cacheLife` profile and `cacheTag` below; anything gated on `auth()`, `currentUser()`, subscription state, grades, certificates, or profile fields MUST NOT be cached at any profile, including `'use cache: private'`.

| Surface                                                                | `cacheLife`    | `cacheTag`                 |
| ---------------------------------------------------------------------- | -------------- | -------------------------- |
| Course catalog listing                                                 | `hours`        | `courses`                  |
| Course detail (public fields)                                          | `hours`        | `course-{id}`              |
| Program detail                                                         | `days`         | `program-{id}`             |
| Guided-project definition                                              | `hours`        | `guided-project-{id}`      |
| Public projects list + detail                                          | `minutes`      | `projects`, `project-{id}` |
| Certificates, profile, lesson progress, activities, subscription gates | none (dynamic) | —                          |

#### Scenario: Cached wrapper lives in the estudiantes tree

- GIVEN a cache wrapper for any surface above
- WHEN `rg -l "'use cache'" src/app/estudiantes/_cache` runs
- THEN every match is under `src/app/estudiantes/_cache/**`, never under `src/server/**`

#### Scenario: Personal data is never cached

- GIVEN `rg "'use cache'" src/app/estudiantes` (excluding `_cache/`)
- WHEN reviewed against the certificates/profile/lesson-progress/activities/subscription surfaces
- THEN none of those routes' own files carry `'use cache'`

### Requirement: No Regression

PayU flows, `agradecimiento-curso`, role/permission checks, subscription gating, the public `/proyectos` URLs, and the 20 `src/app/api/**` routes consuming `~/server/actions/estudiantes/*` MUST behave identically after this change.

#### Scenario: Payment and authorization surfaces unaffected

- GIVEN `next dev` is running
- WHEN `/agradecimiento-curso/[id]` and one `dashboard/**` course route are visited after a test payment/course edit
- THEN enrollment/course state reflects the latest write with no staleness
- AND `npm run check` passes on `src/app/api/**` with no route handler modified (`git diff --stat src/app/api` shows zero changes)

#### Scenario: Public `/proyectos` unaffected for logged-out visitors

- GIVEN a logged-out visitor
- WHEN `/proyectos` and `/proyectos/[id]` are visited in `next dev`
- THEN both render with unchanged behavior and no auth-gated content leaks into the cached shell

### Requirement: Partial Prefetching

`partialPrefetching: true` MUST be set in `next.config.ts` after Cache Components adoption, and the dev Insights sweep MUST show no `instant-shell-url-data` warning on any adopted estudiantes route.

#### Scenario: Prefetching enabled cleanly

- GIVEN `partialPrefetching: true` in `next.config.ts`
- WHEN the `next dev` Insights tab is checked for each adopted route in the Adopted Segment Shells table
- THEN no `instant-shell-url-data` insight appears for any of them
