# Exploration — estudiantes-instant-navigation

Adopt Cache Components and Partial Prefetching, scoped to `src/app/estudiantes/**`.

- **Phase:** `sdd-explore`
- **Artifact store:** hybrid (this file + Engram `sdd/estudiantes-instant-navigation/explore`)
- **Status:** complete
- **Skills read:** `next-cache-components-adoption`, `next-partial-prefetching-adoption`, `next-cache-components`, `next-best-practices`, `next-upgrade`

## 1. Current state

| Fact                                                                              | Value                                            | Evidence                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| Next.js                                                                           | 16.3.0 (already latest)                          | `package.json`                         |
| `cacheComponents`                                                                 | already `true`                                   | `next.config.ts:32`                    |
| `partialPrefetching`                                                              | absent                                           | `next.config.ts`                       |
| `useTypeScriptCli`                                                                | `false`, with documented rationale               | `next.config.ts:49`                    |
| `instant = false` segments                                                        | 40 across all of `src/app` (codemod already ran) | `rg -l "export const instant" src/app` |
| `'use cache'` occurrences                                                         | **0** repo-wide                                  | `rg -l "'use cache'" src`              |
| Leftover `dynamic` / `revalidate` / `fetchCache` / `runtime` / `experimental_ppr` | none                                             | grep                                   |
| `generateStaticParams` / `dynamicParams` under estudiantes                        | none                                             | grep                                   |
| `<Link prefetch={true}>` / `router.prefetch()`                                    | **0** repo-wide (only 4 `prefetch={false}`)      | grep                                   |

The real adoption has not started anywhere: only the mechanical opt-out exists.

## 2. Segment inventory — `src/app/estudiantes/**`

Migration buckets follow the `next-cache-components-adoption` skill:
(a) already instant · (b) needs `use cache` · (c) needs `<Suspense>` around runtime data ·
(d) needs `params`/`searchParams` pushed into `<Suspense>` · (e) genuinely dynamic, stays dynamic.

| Segment                                                    | Blocking read before Suspense                                                                 | Has Suspense                                         | Bucket                   |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------ |
| `layout.tsx`                                               | none                                                                                          | n/a                                                  | (a)                      |
| `page.tsx` (root)                                          | `await searchParams` at top (`:136`)                                                          | yes, 3 sections                                      | (d)                      |
| `foro/[forumId]/page.tsx`                                  | n/a — `'use client'`                                                                          | n/a                                                  | (a)                      |
| `certificados/[id]/page.tsx`                               | `params` + `auth()` (`:24`,`:25`), plus a DB write as a render side effect                    | internal only                                        | (e)                      |
| `clases/[id]/page.tsx`                                     | `params` + `auth()` (`:54`,`:60`) outside the boundary                                        | yes, around `LessonContent`                          | (d)                      |
| `cursos/[id]/page.tsx`                                     | `await Promise.resolve(params)` (`:137`) before the boundary                                  | yes — `CourseContent` reads `auth()` inside, correct | (d)                      |
| `programas/[id]/page.tsx`                                  | none — forwards the promise to the Suspense child                                             | yes (model pattern)                                  | (b)                      |
| `proyectos/[id]/page.tsx`                                  | re-export shim of `~/app/proyectos/[id]/page`                                                 | none in the real file                                | (c)/(d) + scope question |
| `proyectos-guiados/[id]/page.tsx`                          | `params` at top before the boundary                                                           | yes                                                  | (d)                      |
| `certificados/page.tsx`                                    | `auth()` + `db.query.certificates.findMany` (`:26`,`:34`)                                     | none                                                 | (c)/(e)                  |
| `myaccount/page.tsx`                                       | none — client-side Clerk gating via `<Show>`                                                  | yes                                                  | (a)                      |
| `perfil/page.tsx`                                          | `getMyProfile` + `Promise.all(...)` direct                                                    | none                                                 | (c)                      |
| `proyectos/page.tsx`                                       | re-export shim of `~/app/proyectos/page`; real file reads `searchParams` + `auth()` unguarded | none                                                 | (c)/(d) + scope question |
| `proyectos-guiados/[id]/actividades/[activityId]/page.tsx` | `params`, `auth()`, `currentUser()`, subscription gating with `Date`                          | none                                                 | (e)                      |
| `certificados/programa/[id]/page.tsx`                      | same shape as `certificados/[id]`                                                             | internal only                                        | (e)                      |

**No hard synchronous-IO blockers.** Every `new Date()` / `Math.random()` in the estudiantes tree is either inside a `'use client'` component (`StudentDetails.tsx`, `LessonDetails.tsx`, `CourseDetails.tsx`, `ProgramDetails.tsx`) or sits after an `await` already inside the dynamic portion. This matters because `instant = false` does **not** clear sync-IO build errors — there are none to clear.

## 3. Shared-dependency collisions (primary scope risk)

Adding `'use cache'` inside a shared module changes behavior outside the requested scope.

| Shared module                    | Also consumed by                                                                           | Risk   |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| `getGuidedProjectById`           | `src/app/dashboard/super-admin/(inicio)/proyectos-guiados/[projectId]/page.tsx`            | HIGH   |
| `getCourseById`                  | `src/app/agradecimiento-curso/[id]/page.tsx` (PayU flow) + 3 `api/**` routes               | HIGH   |
| `isCourseOwnedByEducator`        | `src/server/services/forums/courseForumAccess.ts`                                          | MEDIUM |
| `~/server/actions/estudiantes/*` | 20 files under `src/app/api/**` (cron, webhooks, `confirmPayment`, `confirmCoursePayment`) | MEDIUM |

**Rule adopted for this change:** never place `'use cache'` inside a shared module. Cache at the
estudiantes call-site, in a local wrapper function.

## 4. Auth, metadata, client hooks

- `auth()` / `currentUser()` are read outside any `<Suspense>` in 6–7 of the 14 server pages.
- `generateMetadata` exists on 3 `[id]` pages; all inherently URL-dependent.
- `usePathname()` in `SiteHeader.tsx:43`, mounted directly in the root layout with no `<Suspense>`.
  The adoption skill flags this exact shape as the most common shell blocker.

**Structural finding:** the root `src/app/layout.tsx` carries `instant = false`. While it stays,
build-time instant validation is suppressed for the entire tree, estudiantes included. Verification
for this change must therefore run through `next dev` per route, not through `next build`.

## 5. Partial Prefetching audit

Repo-wide there are **zero** `<Link prefetch={true}>` and **zero** `router.prefetch()` calls; the only
explicit usage is 4 × `prefetch={false}` in `MyCoursesContent.tsx`. Step 1 of the Partial Prefetching
adoption skill — auditing legacy full-prefetch links — is therefore empty. Enabling the flag has no
legacy link surface to preserve.

## 6. Dependency state — verified with `ncu`

`npx npm-check-updates` (read-only) reports exactly **one** available update across the whole manifest:

```
@clerk/ui  ~1.27.2  →  ~1.28.0   (minor)
```

Confirmed already-latest: `next` 16.3.0, `react` / `react-dom` 19.2.8, `@clerk/nextjs` 7.6.5,
`drizzle-orm` 0.45.2.

> **Correction.** An earlier draft of this exploration flagged `drizzle-orm` 0.x→1.0 as a HIGH
> breaking-change risk, sourced from a web search. That is wrong. `npm view drizzle-orm dist-tags`
> returns `latest: 0.45.2` — 1.0.0 exists only under `beta` / `rc` tags. `ncu` correctly excludes
> prereleases. There is no drizzle migration in scope.

The user's "update all dependencies" request is effectively a one-line bump.

## 7. Uncommitted working tree

96 modified files, `264 insertions(+) / 2185 deletions(-)`, distributed as:
`api` 42 · `dashboard` 19 · `estudiantes` 15 · `src` (root) 5 · `proyectos` 3 · others 1 each.

The 15 estudiantes files are **this change's own starting point** — the diff is exactly the
`cache-components-instant-false` codemod output (`export const instant = false` plus a TODO comment
pointing at the migration guide). Example, `src/app/estudiantes/page.tsx`:

```diff
+// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
+// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
+export const instant = false;
```

The remaining ~81 files (api, dashboard, security hardening) are unrelated prior work.

## 8. Open scope questions for `sdd-propose`

1. **`proyectos` shims.** `estudiantes/proyectos/page.tsx` and `estudiantes/proyectos/[id]/page.tsx`
   only re-export implementations living at `~/app/proyectos/**`. Adopting them requires editing
   files outside `src/app/estudiantes/**`.
2. **Root-layout opt-out.** Keeping `instant = false` on `src/app/layout.tsx` suppresses build
   validation for estudiantes. Removing it pulls the root layout and `SiteHeader`'s `usePathname`
   into scope.
3. **Uncommitted tree.** Whether the ~81 unrelated files are committed before this change starts.

## 9. Risks

| Severity | Risk                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------ |
| HIGH     | Root-layout opt-out masks build validation for estudiantes; verify via `next dev` per route            |
| HIGH     | `getGuidedProjectById` / `getCourseById` shared with dashboard and the PayU thank-you page             |
| MEDIUM   | 20 API routes (cron / webhooks / payments) consume the same estudiantes actions — stale-cache exposure |
| MEDIUM   | `proyectos/**` shims resolve outside the declared scope                                                |
| MEDIUM   | `certificados/[id]` and `certificados/programa/[id]` perform DB writes during a GET render             |
| MEDIUM   | The activity page gates on subscription state — payment-adjacent, prefer leaving dynamic               |
| LOW      | No test runner (`strict_tdd: false`); verification baseline is `npm run check` + per-route `next dev`  |

## 10. Recommendation

Work bucket by bucket inside `src/app/estudiantes/**`, caching only at estudiantes call-sites and
never inside shared modules, leaving bucket (e) segments as documented opt-outs. Treat the
dependency update as a trivial separate step. Enable `partialPrefetching` after the Cache Components
work lands, since it has no legacy link surface to migrate.

**Next recommended phase:** `sdd-propose`.
