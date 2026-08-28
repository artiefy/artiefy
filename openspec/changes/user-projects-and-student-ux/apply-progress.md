# Apply Progress: user-projects-and-student-ux

## Batch 1 — PR1 (navigation) — DONE

Completed tasks (see `tasks.md` Phase 1, marked `[x]`):

- [x] 1.1 Deleted `src/components/estudiantes/layout/lessondetail/NextLessonModal.tsx`.
- [x] 1.2 Removed the `NextLessonModal` import and its render block from
      `src/app/estudiantes/clases/[id]/LessonDetails.tsx`.
- [x] 1.3 Restyled the next control in
      `src/components/estudiantes/layout/lessondetail/LessonNavigation.tsx` to
      `bg-primary text-background` (accent, prominent); prev control stays
      the original ghost/slate treatment; disabled state keeps its own
      distinct muted style; `aria-label`s untouched.
- [x] 1.4 Removed the floating "Siguiente" pill block (former lines ~897-914)
      from `src/components/estudiantes/proyectos/GuidedActivityDetails.tsx`
      and restyled the top-nav next `Button` (former lines ~535-548) from
      `variant="ghost"` to `variant="default"` plus explicit
      `bg-primary text-background hover:bg-primary/90` classes.

### Deviation from tasks.md wording (documented)

Task 1.4 says restyle "from `ghost` to `variant=\"default\"`". In this repo's
`src/components/estudiantes/ui/button.tsx`, the `default` variant is defined
as an **empty string** (no background/foreground classes) — unlike the
shadcn convention where `default` implies `bg-primary`. Using
`variant="default"` alone would have produced an unstyled, invisible button,
failing the spec requirement ("accent-colored, visually prominent style").
Explicit `bg-primary text-background hover:bg-primary/90` classes were added
on top of `variant="default"` to satisfy the actual requirement while still
following the task's variant change. This mirrors the same token pairing
used in `LessonNavigation.tsx` (task 1.3) for visual consistency between the
two views.

### Files changed (PR1)

- Deleted: `src/components/estudiantes/layout/lessondetail/NextLessonModal.tsx`
- Modified: `src/app/estudiantes/clases/[id]/LessonDetails.tsx`
- Modified: `src/components/estudiantes/layout/lessondetail/LessonNavigation.tsx`
- Modified: `src/components/estudiantes/proyectos/GuidedActivityDetails.tsx`
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (marked 1.1-1.4 `[x]`)

### Not done (out of scope for this batch, untouched)

- Phase 3a (3a.1-3a.2): Projects UI — `ProjectFeedCard.tsx`,
  `ProjectsSocialView.tsx`.
- Phase 3b (3b.1-3b.7): Migration + chat API — `schema.ts`, migration SQL,
  `createProject.ts`, `src/app/api/projects/route.ts`,
  `agentChatBus.ts`, `src/app/api/agents/chat/route.ts`.

### Verification status

No `npm run check`/`lint`/`typecheck`/`build` run per repo validation-timing
policy (runs at commit time, not per edit). No integrated-browser visual
check was performed this batch — no browser tool was available in this
session's toolset. Recommend a manual/browser check of
`/estudiantes/clases/[id]` and a guided-project activity page before
committing PR1, to confirm the next-control accent color and removed pills
render as expected.

### Not committed

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 3a — PR3a (projects UI) — DONE

Completed tasks (see `tasks.md` Phase 3a, marked `[x]`):

- [x] 3a.1 In
      `src/components/estudiantes/proyectos/subcomponents/ProjectFeedCard.tsx`,
      the description is split on `/\n\s*\n/` into paragraphs. When it has
      more than one paragraph (paragraph-structured), the first 3 render and,
      if there are more than 3, a real `<button type="button">` "Ver más" /
      "Ver menos" appears below with `aria-expanded` reflecting state; when
      there are 3 or fewer, all render with no button at all (no dead "ver
      más"). When the description has no paragraph breaks (a single block),
      it falls back to a `line-clamp-6 whitespace-pre-wrap` paragraph; a
      `useEffect` compares `scrollHeight` vs `clientHeight` on that node
      (measured only while collapsed and not paragraph-structured) to decide
      whether it actually overflows before showing the toggle — this is a
      genuine layout measurement that cannot be derived without the DOM node,
      so it is not an "unnecessary" `useEffect`.
- [x] 3a.2 In `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`,
      added `isCreateModalOpen` state (fully independent of the pre-existing
      `isEditModalOpen`/`editingProject` edit state — the two flows cannot
      collide because they are separate booleans driving separate
      `ModalResumen` instances) and `handleCreateProject`, wired as
      `onCreateProject` on `ProjectsLeftRail` (that prop already existed on
      the component but was never passed, so the "+ Nuevo proyecto" button
      was previously dead). Added a second, sibling `<ModalResumen>` instance
      dedicated to creation: all content props blank/undefined
      (`titulo=""`, `description=""`, `projectId={undefined}`,
      `courseId={undefined}`, etc.), so it always starts the wizard fresh at
      step 1 with no course preselected, matching the wizard's own
      `isOpen`-keyed reset effect (`ModalResumen.tsx` lines ~1449-1467, which
      re-syncs `currentStep`/`currentProjectId`/`isProjectCreated` from props
      every time it opens). `onProjectCreated` reloads the page, identical to
      the existing edit-modal refresh mechanism, so the new project appears
      in "Mis proyectos" (owner always sees their own project) and in the
      public feed only if `isPublic` was checked in the wizard — no new
      visibility rule was introduced; it reuses the exact same
      `projects.isPublic` mechanism the wizard's step-1 payload
      (`ModalResumen.tsx:1942`, `isPublic: formData.isPublic ?? false`)
      already writes for course-linked projects. Closing either modal
      (`onClose`) only flips its own boolean, so the next create/edit open
      always starts clean.

### Explicitly deferred to PR3b (per this slice's scope)

- Calling `openAgentChatFor()` after a successful create — the coach-chat
  scope resolution it depends on (`agentChatBus.ts`'s `source` field,
  `/api/agents/chat/route.ts` falling back to `projects` for user-owned
  projects) does not exist yet; that is task 3b.6/3b.7.
- `projects.type` column, its migration, and any `schema.ts` change.
- Everything else in Phase 3b (untouched, unchecked).

### Files changed (PR3a)

- Modified:
  `src/components/estudiantes/proyectos/subcomponents/ProjectFeedCard.tsx`
- Modified: `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (marked
  3a.1-3a.2 `[x]`, with a note on 3a.2's deferred chat-open sub-step)

### Not touched (per hard constraints)

`ProjectsSection.tsx:641` (separate card, separate `line-clamp-2` behavior,
left as-is), `src/server/db/schema.ts`, `src/app/api/agents/chat/route.ts`,
and every PR1/PR2 file listed above.

### Verification status

No `npm run check`/`lint`/`typecheck`/`build` run per validation-timing
policy. No integrated-browser check was performed this batch — no browser
tool was available in this session's toolset. Recommend a manual pass before
committing PR3a: on `/proyectos`, open a project with a long, paragraph-broken
description (confirm only 3 paragraphs show, "Ver más"/"Ver menos" toggles
correctly) and one with a long single-block description with no blank lines
(confirm the line-clamp fallback only shows "Ver más" when it actually
overflows visually); then click "+ Nuevo proyecto", complete the 8-step
wizard with no course context, and confirm the new project appears after
reload without disturbing an in-progress edit of another project.

### Not committed

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 2 — PR2 (chat UX) — DONE

Completed tasks (see `tasks.md` Phase 2, marked `[x]`):

- [x] 2.1 Created `src/hooks/useMessageReveal.ts`: rAF-driven cursor, snaps
      each tick to the next word boundary (never cuts a word), commits state
      at most every ~40ms, reveal rate `max(900 chars/s, length/2.2s)` so a
      long answer still finishes in ≈2.2s, instant under
      `prefers-reduced-motion: reduce`, and cancels its `requestAnimationFrame`
      loop on unmount or the moment `active` turns false.
- [x] 2.2 Created `src/components/agents/AgentRevealedContent.tsx`: a leaf
      wrapper around `AgentMessageContent` that owns the reveal state via
      `useMessageReveal` (per design D2, so a tick re-renders only this one
      bubble, not the whole `messages.map`). Calls `onRevealTick` on every
      growth. Skips the animation entirely (renders full text instantly) when
      the message contains a ` ``` ` code fence, per design D3 — avoids
      re-parsing/remounting the lazily-loaded `AgentCodeBlock` on every tick.
- [x] 2.3 In `AgentChatWidget.tsx`: added `revealingId` state; every agent
      bubble now renders through `AgentRevealedContent` with
      `active={message.id === revealingId}`; `revealingId` is set to the new
      message id the moment a reply lands, cleared to `null` at the start of
      every `sendMessage` call (cancels an in-progress reveal the instant a
      new turn begins) and inside `leaveConversation` (covers switching/
      deleting/starting conversations and the `subscribeToAgentChat` handler,
      which all funnel through it). Added `handleRevealTick`, which re-pins
      the scroll container via the existing `pinToBottom()` only when the
      learner was already at the bottom — this is the imperative re-pin design
      risk #4 calls for, since a growing bubble never changes the `messages`
      array itself so the existing `messages`-keyed pin effect cannot see it.
- [x] 2.4 In `AgentChatWidget.tsx`: added an expand button (`Maximize2`/
      `Minimize2` from lucide-react) in the header, placed immediately to the
      left of the existing "Cambiar de agente" (`Users`) button, with a
      Spanish `aria-label`/`title` that flips between "Expandir el chat a
      pantalla completa" and "Salir de pantalla completa", `aria-expanded`
      mirroring state, an explicit `focus-visible:outline` ring, and
      `disabled` while popped out (full-window mode does not apply there).
      Added `isExpanded` state and derived `isFullWindow = isExpanded &&
  !isPoppedOut`. The panel's outer class swaps to
      `fixed inset-0 z-[100010]` and the inner glass panel to `rounded-none`
      while `isFullWindow`; drag (`canMovePanel`) and the 8 resize handles are
      disabled/hidden in that state. `panelRect`, `pipWindow`, and
      `togglePopOut` are untouched — expanding never mutates the dragged/
      detached geometry, so collapsing (via the same button or Escape, newly
      wired) restores the exact previous size and position. Per design D4,
      the final `createPortal` is now **unconditional**: whenever not popped
      out, the panel portals to `document.body` regardless of `isExpanded`
      (previously it rendered inline in the host route's tree). This was the
      one behavior change beyond the minimum: a _conditional_ portal would
      remount the panel subtree on every expand/collapse, losing scroll
      position and focus, and — per the design's own risk note — a fixed
      panel left inside a transformed/glass ancestor (e.g. the guided-project
      route's own subtree) cannot climb any z-index above the site header,
      because that ancestor already owns its own stacking context. Also added
      `isExpanded` to the existing width-measuring effect's dependencies, so
      `measuredWidth` (and therefore the docked-history-at-width breakpoint)
      re-reads the instant full-window mode toggles, since that layout change
      does not fire a native `resize` event on its own.
- [x] 2.5 In `buildQuotaNotice()`: replaced "mensajes" → "intentos" across all
      three tiers (anon, free, premium), keeping each tier's existing Spanish
      sentence structure grammatical (e.g. "Se te acabaron los intentos
      gratis", "Ya usaste los ${quota.limit} intentos de cortesía", "Llegaste
      a tus intentos de hoy"). Audited the rest of the file for "mensaje(s)":
      the four remaining hits (`THINKING_STEPS[0]`, its own inline comment,
      the "ir al último mensaje" scroll-to-bottom button, the composer
      placeholder/aria-label) all refer to a chat message generically, not the
      quota, and were left unchanged as instructed.

### Files changed (PR2)

- Created: `src/hooks/useMessageReveal.ts`
- Created: `src/components/agents/AgentRevealedContent.tsx`
- Modified: `src/components/agents/AgentChatWidget.tsx`
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (marked
  2.1-2.5 `[x]`)

### Not touched (per hard constraints)

`src/app/api/agents/chat/route.ts` (n8n webhook contract untouched — the
reveal is purely client-side over the already-complete response), and every
PR1/PR3a/PR3b file listed above.

### Verification status

No `npm run check`/`lint`/`typecheck`/`build` run per validation-timing
policy. No integrated-browser check was performed this batch either — no
browser tool was available in this session's toolset. Recommend a manual
pass before committing PR2: open the chat, send a message and watch the
reveal (both normal and with OS-level reduced motion on), toggle expand/
collapse (confirm it renders above the site header and its dropdowns, and
that Escape collapses it), and exhaust the quota for all three tiers (anon/
free/premium) to read the new "intentos" copy.

### Not committed

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 3b — PR3b (schema + chat API) — CODE DONE, MIGRATION AWAITING APPROVAL

Completed tasks (see `tasks.md` Phase 3b, marked `[x]`, except 3b.2/3b.3):

- [x] 3b.1 In `src/server/db/schema.ts`, added
      `type: text('type', { enum: ['course', 'user'] }).default('course').notNull()`
      to the `projects` table (right after `courseId`), with a comment noting
      it is descriptive only — the coach-chat access check is the owner
      check, not this column. **Code-only, per hard constraint: no
      `db:generate`/`db:migrate`/`db:push`/`drizzle-kit` command was run.**
- [x] 3b.4 In `src/server/actions/project/createProject.ts`, the `ProjectData`
      interface gained an optional `type?: 'course' | 'user'`, and the insert
      now sets
      `type: projectData.type ?? (projectData.courseId ? 'course' : 'user')`
      — a caller can pass an explicit `type`, but the default correctly keys
      off whether a course is present, never a flat `'course'`.
- [x] 3b.5 In `src/app/api/projects/route.ts`, the local `ProjectData`
      interface gained the same optional `type?: 'course' | 'user'` field,
      and `projectData.type = body.type ?? undefined` passes it straight
      through to `createProject` (which fills in the correct default when
      absent, per 3b.4). This route is what `ModalResumen.tsx`'s
      `useSWRMutation` actually calls (`POST /api/projects?draft=true`), so
      both the create and edit wizard flows are covered.
- [x] 3b.6 In `src/lib/agents/agentChatBus.ts`, the `'project'` member of
      `AgentChatScope` gained an optional
      `source?: 'guided' | 'user'` field, documented as "absent means resolve
      as guided-first, like every conversation before this field existed" —
      it is a disambiguation hint, never a security boundary on its own.
      `StoredConversation.scope` already serializes the whole scope object to
      `localStorage`, so `source` is persisted for free on every saved
      conversation without any change to the read/write paths.
- [x] 3b.7 In `src/app/api/agents/chat/route.ts`:
  - `AgentChatRequestBody` gained `projectSource?: unknown`, narrowed to
    `const projectSource = body.projectSource === 'user' ? 'user' : undefined`.
  - Added `buildUserProjectContext()`, the Coach counterpart of
    `buildProjectContext()` for a project with no course and no guided
    curriculum: title (`name`), `description`, `planteamiento`,
    `justificacion`, `objetivo_general` — the same "only source of truth"
    rule the guided/course builders already follow.
  - Resolution now: when `projectSource === 'user'`, `getGuidedProjectById`
    is **skipped entirely** and the general `projects` table is queried
    directly. Otherwise `getGuidedProjectById` runs first, exactly as
    before. If it returns a project, the existing
    `if (!guidedProject.enrolled)` 403 ("Este proyecto guiado es Premium")
    is **byte-identical** to the pre-existing code — same title, body,
    hrefs. Only when the guided lookup returns **null** (id absent from
    `guidedProjects`, which is exactly what happened before this change for
    every user-project id, producing the reported bug) does it now fall
    through to a `db.query.projects.findFirst` lookup, gated by
    `userProject.userId === userId`; a non-owner (or a genuinely
    non-existent id) gets a new, differently-worded 403 in the same
    `AccessNotice` shape (`title`/`body`/`primary`/`secondary`) as the
    guided rejection — text was NOT copied verbatim, since "Este proyecto
    guiado es Premium" would be a lie for a courseless user project; the
    task's "mirror the response shape" was read as the notice's shape, not
    its literal Spanish copy.
  - Session id for the new branch is `${userId}:userproject:${projectId}`
    (guided stays `${userId}:project:${projectId}`, unchanged).
  - The n8n webhook payload's `projectId` is now `null` for a resolved user
    project (`hasProjectContext && !isUserProjectContext`), so the RAG step
    can never read a colliding guided-project document under the same
    numeric id, per design D7.
  - `AgentChatWidget.tsx`'s `sendMessage` now also sends
    `projectSource: scope.kind === 'project' ? scope.source : undefined` in
    the POST body, so a scope opened with `source: 'user'` actually reaches
    the new branch.

### Post-save coach chat (design's "Wire the post-save hook")

- In `src/components/projects/Modals/ModalResumen.tsx`, `onProjectCreated`
  changed from `() => void` to `(createdId?: number, createdTitle?: string) => void`,
  and its single call site (right after `createProject`'s POST succeeds, at
  the step-1→2 transition) now passes `(createdId, title)`. This is
  backward-compatible: every existing caller passes a zero-arg arrow
  function, and TypeScript/JS both allow a callback to ignore extra
  arguments it does not declare — `ProjectsSection.tsx`'s two call sites and
  the edit-modal instance in `ProjectsSocialView.tsx` needed no changes.
- In `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`, the
  create modal's `onProjectCreated` now calls `openAgentChatFor()` with
  `scope: { kind: 'project', id: createdId, title: createdTitle ?? 'tu
proyecto', source: 'user' }` before refreshing — the same
  `openAgentChatFor` DOM-event pattern already used post-enrollment in
  `CourseDetails.tsx` and `GuidedProjectDetails.tsx`.
- **Deviation, and why it was necessary:** the existing create-modal callback
  was `() => { window.location.reload(); }` (from PR3a). A hard
  `window.location.reload()` immediately after `openAgentChatFor()` would
  discard the freshly opened chat before the learner ever sees it — the
  dispatched `CustomEvent` runs its listener synchronously, but React's
  resulting state updates never get to paint before the full page reload
  tears down the entire app. `GuidedProjectDetails.tsx` and
  `CourseDetails.tsx` avoid exactly this by using `router.refresh()` (Next.js
  soft refresh: re-fetches Server Component data without unmounting the
  client tree, so the globally-mounted `AgentChatWidget` stays alive and the
  chat it just opened stays open). `ProjectsSocialView.tsx` did not have a
  router instance, so this batch added `const router = useRouter();` (from
  `next/navigation`) and switched **only the create modal's** callback to
  `router.refresh()`. The **edit modal's** `onProjectCreated` (line ~652,
  `window.location.reload()`) was deliberately left untouched — no coach
  chat opens from an edit, so the hard reload there is not broken by
  anything in this batch, and touching it would be out of this task's scope.

### Discovered gap — flagged, not fixed (out of this task's explicit scope)

`src/app/api/estudiantes/projects/route.ts` has its own, separate
`db.insert(projects)` call (a different endpoint,
`POST /api/estudiantes/projects`, not used by `ModalResumen.tsx`) that never
sets `courseId` or `type` at all. Its rows are always courseless in practice,
so they will silently get `type = 'course'` from the column's DB default
once the migration in 3b.2/3b.3 is applied — mislabeling them the same way
the original flat-`DEFAULT` approach would have mislabeled every existing
row. The task list for this slice named only `createProject.ts` and
`src/app/api/projects/route.ts`, so this file was left untouched rather than
silently expanding scope; recommend a follow-up task to either route it
through `createProject()` or add `type: 'user'` to its own insert.

### Files changed (PR3b)

- Modified: `src/server/db/schema.ts` (added `type` column to `projects`)
- Modified: `src/server/actions/project/createProject.ts` (`type` in
  `ProjectData` + insert)
- Modified: `src/app/api/projects/route.ts` (`type` in `ProjectData` +
  pass-through)
- Modified: `src/lib/agents/agentChatBus.ts` (`source` on the `'project'`
  scope variant)
- Modified: `src/components/agents/AgentChatWidget.tsx` (sends
  `projectSource` in the chat POST body)
- Modified: `src/app/api/agents/chat/route.ts` (guided-first + user-project
  fallback resolution, `buildUserProjectContext()`, session id, n8n
  `projectId` nulling)
- Modified: `src/components/projects/Modals/ModalResumen.tsx`
  (`onProjectCreated` signature + call site)
- Modified: `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`
  (`useRouter`, post-save `openAgentChatFor`, create modal's refresh)
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (marked
  3b.1, 3b.4-3b.7 `[x]`; 3b.2/3b.3 explicitly left unchecked and annotated
  "AWAITING USER APPROVAL")

### PENDING USER APPROVAL — database

**No database command was run.** The schema change in `schema.ts` is
code-only until these exact steps are explicitly approved and run:

1. `npm run db:generate` — produces `drizzle/0011_*.sql` from the `type`
   column added in `schema.ts`.
2. Apply via the repo's neon-http workaround (`npm run db:migrate` hangs in
   this environment) against `POSTGRES_URL_NON_POOLING`, **in this exact
   order** (a flat `ADD COLUMN ... DEFAULT 'course' NOT NULL` in one
   statement is WRONG — it would label every existing courseless row as
   `'course'`):

   ```sql
   ALTER TABLE "projects" ADD COLUMN "type" text;
   UPDATE "projects" SET "type" = CASE WHEN "course_id" IS NULL THEN 'user' ELSE 'course' END;
   ALTER TABLE "projects" ALTER COLUMN "type" SET NOT NULL;
   ALTER TABLE "projects" ALTER COLUMN "type" SET DEFAULT 'course';
   ```

3. Register the migration hash in `drizzle.__drizzle_migrations`
   (`hash = sha256(sql)`, `created_at = journal.when`), matching this repo's
   established workaround (see Engram `artiefy-db-migrations`).
4. Verify via `information_schema.columns` that `projects.type` is
   `text`, `NOT NULL`, `DEFAULT 'course'`.
5. Delete the throwaway script used to run steps 2-3.

Until this runs, the `type` column does not exist in the actual database —
every `db.insert(projects)` call in code above would fail against the real
database (though it type-checks) if executed before the migration lands.
Code review of the logic can proceed; end-to-end testing of project
creation/the coach chat cannot, until this migration is approved and
applied.

### Verification status (PR3b)

No `npm run check`/`lint`/`typecheck`/`build` run per validation-timing
policy. No integrated-browser check was performed — no browser tool was
available in this session's toolset, and the chat-route/schema changes
cannot be exercised end-to-end without the pending migration anyway.
Recommend, once the migration is approved and applied: create a user
project via "+ Nuevo proyecto", confirm the coach chat opens scoped to it
without a page flash, ask it something about the project, then try opening
the same scope as a different user and confirm the "Este proyecto no es
tuyo" rejection.

### Not committed (PR3b)

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 3c — Courseless Project Workspace (continuation) — DONE

Completed tasks (see `tasks.md` Phase 3c, marked `[x]`):

- [x] 3c.1 Created `src/app/estudiantes/proyectos/[id]/trabajar/page.tsx`: an
      async Server Component. Resolves `params`, `Number(id)` coerced and
      checked with `Number.isFinite`, `notFound()` on a bad id. Calls
      `auth()` from `@clerk/nextjs/server` and `getProjectById(projectId)`
      from `src/server/actions/project/getProjectById.ts`. Owner gate is a
      single `if (!project || project.userId !== userId) notFound();` after
      an earlier `if (!userId) notFound();` — a missing project and a
      non-owner both fall through to the exact same generic `notFound()`,
      so a non-owner cannot distinguish "doesn't exist" from "not yours".
      Renders `<UserProjectWorkspace project={project} /><Footer />` and
      carries the same
      `// TODO: Cache Components adoption...` / `export const instant = false;`
      opt-out block every sibling route in this repo has (copied verbatim
      from `src/app/proyectos/[id]/page.tsx`, the reference route named in
      the task).
- [x] 3c.2 Created
      `src/components/estudiantes/proyectos/UserProjectWorkspace.tsx`
      (`'use client'`). Renders `ProjectDetailView` (default export from
      `~/components/estudiantes/projects/ProjectDetailView`) with a local
      `project` state seeded from the server-fetched prop (`useState`, not a
      bare prop pass-through) so `onUpdateProject` can optimistically patch
      it the same way `ProjectsSection.tsx`'s `applyProjectUpdate` does,
      without waiting for a full server round-trip while the wizard is open.
      Owns `showModal`/`modalStep`/`addedSections` state; `onEditSection`
      wires to open `ModalResumen` at that step, copied from
      `ProjectsSection.tsx`'s `handleEditSection`. `ModalResumen` gets
      `courseId={undefined}` and `projectId={project.id}` (see the "How the
      edit-not-duplicate behavior was confirmed" note below), plus
      `onUpdateProject={applyProjectUpdate}`. On modal close
      (`handleModalClose`), calls `router.refresh()` — never
      `window.location.reload()`, matching this batch's constraint and the
      `router.refresh()` pattern PR3b already established in
      `ProjectsSocialView.tsx`'s create-modal callback for the identical
      "don't tear down chat/UI state" reason. A `Link href="/proyectos"`
      "Volver a proyectos" control (`FaArrowLeft` + the exact button
      classes `ProjectsSection.tsx`'s own back button uses) sits above the
      workspace.
- [x] 3c.3 In `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`,
      added a `getWorkHref()` sibling to the existing `getPublishHref()`:
      identical course-linked branch
      (`/estudiantes/cursos/${courseId}?projectId=${id}&view=projects`), but
      the courseless branch returns
      `/estudiantes/proyectos/${item.id}/trabajar` instead of
      `/estudiantes/proyectos/${item.id}` (the public read-only detail
      page). Only the `ProjectWorkspaceCard`'s `workHref` prop switched to
      `getWorkHref(item)`; `publishHref={getPublishHref(item)}` is
      byte-for-byte unchanged. In
      `src/components/estudiantes/profile/ProfileView.tsx`, added the
      equivalent `projectWorkHref()` next to the existing `projectHref()`
      (same split: course branch identical, courseless branch appends
      `/trabajar`); `ProjectWorkspaceCard`'s `workHref` now calls
      `projectWorkHref(item)` while `publishHref` keeps calling
      `projectHref(item)`, unchanged.

### How the edit-not-duplicate behavior was confirmed (load-bearing)

Read `ModalResumen.tsx` directly (not assumed) at three points:

1. Its `isOpen`-keyed reset effect (`ModalResumen.tsx` ~line 1447-1473): on
   every open it runs `setCurrentProjectId(projectId); setIsProjectCreated(Boolean(projectId));`
   — passing a defined `projectId` makes `isProjectCreated` start `true`.
2. `isCreateStep = currentStep === 1 && !isProjectCreated` (~line 2011) and
   `handleCreateProject` (~line 1895), the function that does the
   `createProject()` POST that would create a **new** row, is only ever
   invoked from the step-1 "create" UI path gated by `isCreateStep`.
3. Since `isProjectCreated` is `true` from the moment the modal opens (step
   1 above), `isCreateStep` is `false`, so `handleCreateProject` — and
   therefore `createProject()` — is never called. Step 1 instead renders
   its existing-project edit form, sourced from `useSWR`'s
   `` `/api/projects/${projectId}?details=true` `` fetch (~line 1140-1142),
   gated by `enabled: isProjectCreated && Boolean(currentProjectId)`
   (~line 1276-1277) — i.e. the same `existingProject` data-loading path
   `ProjectsSection.tsx`'s `modalProject?.id` case and
   `ProjectsSocialView.tsx`'s edit modal (`editingProject?.id`) already rely
   on for editing, not creating.

This is the exact same mechanism those two pre-existing edit flows use, so
`UserProjectWorkspace.tsx` passing `projectId={project.id}` puts
`ModalResumen` in the same "edit an existing project" mode as both of them
— it does not create a second project on every pencil click.

### `Project` vs `ProjectDetail` typing (documented, not a deviation)

`getProjectById()` returns `ProjectDetail` (its own interface in
`getProjectById.ts`), while `ProjectDetailView`/`UserProjectWorkspace` are
typed against `~/types/project`'s `Project`. The two are not the same
declared type, but every field `Project` requires (`id`, `name`,
`planteamiento`, `type_project`, `categoryId`, `createdAt`, `updatedAt`) is
present on `ProjectDetail` with a compatible (often more specific, e.g.
required vs optional) type, so passing the `getProjectById()` result where a
`Project` is expected type-checks structurally with no adapter needed — this
is the same shape `ProjectsSection.tsx` already treats `as Project` after
fetching from `/api/projects/${id}?details=true` (which is `getProjectById()`
under the hood), so this is an established pattern in this codebase, not a
new risk. One pre-existing, out-of-scope quirk carried over unchanged:
`ProjectDetail`'s activities live under the key `actividades`, while
`Project`/`ProjectDetailView` read `project.activities` (English key) — this
mismatch already exists for every course-linked project using this same
component and was not introduced or fixed by this batch.

### Files changed (Batch 3c)

- Created: `src/app/estudiantes/proyectos/[id]/trabajar/page.tsx`
- Created: `src/components/estudiantes/proyectos/UserProjectWorkspace.tsx`
- Modified: `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`
  (added `getWorkHref()`, switched `ProjectWorkspaceCard`'s `workHref` to it)
- Modified: `src/components/estudiantes/profile/ProfileView.tsx` (added
  `projectWorkHref()`, switched `ProjectWorkspaceCard`'s `workHref` to it)
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (added
  Phase 3c, 3c.1-3c.3 marked `[x]`)

### Not touched (per hard constraints)

`src/components/estudiantes/proyectos/projectSocialData.ts`,
`src/components/agents/AgentChatWidget.tsx`, `src/app/proyectos/[id]/page.tsx`,
`src/server/db/schema.ts`, `src/app/api/agents/chat/route.ts`, and every
PR1/PR2/PR3a/PR3b file listed above.

### Verification status (Batch 3c)

No `npm run check`/`lint`/`typecheck`/`build` run per validation-timing
policy. No integrated-browser check was performed — none was started this
session. Recommend, once verified convenient: as a student with no active
course project, create a project via "+ Nuevo proyecto" on `/proyectos`,
click "Trabajar" on its card, confirm the same tabbed workspace a
course-linked project shows appears (not the public read-only detail page),
click a section pencil, confirm the wizard opens directly at that step with
the project's existing data (not a blank step 1), save, and confirm the
change reflects without a full page reload; then, as a different signed-in
user, try navigating directly to that project's `/trabajar` URL and confirm
a 404 with no distinguishing information.

### Not committed (Batch 3c)

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 4 — Community Posts: Schema + API (continuation, no UI) — CODE DONE, MIGRATION PENDING

Completed tasks (see `tasks.md` Phase 4, marked `[x]`, except 4.4):

- [x] 4.1 In `src/server/db/schema.ts`, added the `communityPosts` table
      (SQL name `community_posts`), placed right after the `projects` table
      (before `specificObjectives`):

  ```ts
  export const communityPosts = pgTable('community_posts', {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    projectId: integer('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    kind: text('kind', {
      enum: ['none', 'update', 'milestone', 'request'],
    })
      .default('none')
      .notNull(),
    content: text('content').notNull(),
    imageKey: text('image_key'),
    linkUrl: text('link_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  });
  ```

  **Delete rule chosen for `projectId`: `onDelete: 'set null'`.** The column
  is nullable by design (null = general publication not tied to a project),
  so when its project is deleted the post degrades gracefully to a general
  publication instead of being deleted itself (`cascade`, which the task
  explicitly warned against — "must not orphan or crash the feed") or
  blocking the project delete (`restrict`/default no-action, which has no
  precedent in this schema for a nullable FK and would surprise whoever
  deletes a project next). `restrict` was rejected because nothing else in
  `schema.ts` restricts on a nullable reference; `cascade` was rejected
  because deleting the project would silently delete someone's social post,
  which is a worse UX regression than the post losing its project link.
  Added `communityPostsRelations` (`user`, `project`) grouped with the other
  post-like relations right after `postLikesRelations`, matching how
  `projectsRelations`/`postRelations`/`postRepliesRelations` are written
  (same `relations(table, ({ one }) => ({ ... }))` shape, same
  `fields`/`references` style). Left `posts`, `postReplies`, and `forums`
  completely untouched — `communityPosts` is a separate table with no shared
  code path.

- [x] 4.2 Created `src/app/api/community-posts/route.ts`:
  - `POST` — `auth()` from `@clerk/nextjs/server`, 401 when signed out.
    Body validated with zod: `content` (`z.string().trim().min(1).max(2000)`),
    `kind` (`z.enum(['none','update','milestone','request']).default('none')`),
    `projectId` optional (`z.coerce.number().int().positive().optional()`),
    `imageKey` optional string, `linkUrl` optional
    (`z.string().trim().url().max(2048).optional()`). When `projectId` is
    present, looks the project up first (404 if it doesn't exist), then
    requires `project.userId === userId || project.isPublic` — **rejects
    with 403 otherwise, never trusting the client's own claim about
    ownership/visibility.** Inserts via `db.insert(communityPosts)` and
    returns the created row with `201`.
  - `GET` — no auth required (public feed read). Inner-joins `users` for
    the author, left-joins `projects` for the optional project, orders by
    `desc(communityPosts.createdAt)`, `limit` query param clamped to
    `[1, 50]` (default `20`) via `resolveLimit()`. Shapes each row into
    `{ id, content, kind, imageKey, linkUrl, createdAt, updatedAt, author:
{ id, name, email }, project: { id, name } | null }` so a client can
    render "«autor» publicó en «proyecto»" directly, or omit the "en
    «proyecto»" clause when `project` is `null`.

- [x] 4.3 Created `src/server/actions/project/getPublishableProjects.ts`
      (`'use server'`, placed alongside the other `src/server/actions/project/`
      query helpers, matching `getUserProjects.ts`'s placement/style):
      `getPublishableProjects(userId)` selects every row where
      `eq(projects.userId, userId) OR eq(projects.isPublic, true)`,
      deduplicates by `id` (a project can match both conditions), and
      returns `{ id, name, isOwner }[]` sorted with the caller's own
      projects first, then by most recently updated
      (`projects.updatedAt desc`). This is the exact set the task specified:
      all of the user's own projects (public or private) plus other users'
      public projects, nothing else. The selector UI itself (the modal's
      "Buscar proyecto..." list) is out of scope for this batch — only the
      server-side data function was requested.

### Not done (explicit gate, per hard constraints)

- [ ] 4.4 **No `db:generate`/`db:migrate`/`db:push`/`drizzle-kit` command was
      run.** The `communityPosts` table exists in `schema.ts` only — it does
      not exist in the actual Neon database yet. Any `db.insert(communityPosts)`
      / `db.select().from(communityPosts)` call would fail at runtime against
      the real database until a migration is generated and applied (same
      approval gate as Phase 3b's `type` column — `npm run db:migrate` hangs
      in this environment; the neon-http workaround with manual hash
      registration in `drizzle.__drizzle_migrations` applies here too).
      Code review can proceed; end-to-end testing of `/api/community-posts`
      cannot, until this migration is approved and applied.

### Deliberately not built (per scope — "SCHEMA + API only. No UI.")

- No modal, menu, or bottom sheet for composing a post.
- No wiring into `/proyectos`'s existing feed rendering.
- `posts`, `postReplies`, `forums`, `ModalResumen.tsx`, `AgentChatWidget.tsx`,
  and everything under `src/components/` were left untouched, per the hard
  constraints.

### Risk noted, not resolved (flagged, out of this batch's scope)

`GET /api/community-posts` does not re-check the _current_ visibility of a
linked project at read time — only `POST` checks ownership/`isPublic` at
creation time. If an owner later flips a project from public to private, a
community post that references it keeps showing the project's name/id in the
feed response (the post row itself has no independent visibility flag). The
task description did not ask for a live re-check on every `GET`, so this was
not implemented, but it is worth a follow-up decision: either re-check
`project.isPublic` in the `GET` join (extra cost per request) or accept that
a post's project reference is a point-in-time snapshot of permission, not a
live one.

### Files changed (Batch 4)

- Modified: `src/server/db/schema.ts` (added `communityPosts` table +
  `communityPostsRelations`)
- Created: `src/app/api/community-posts/route.ts` (`GET`, `POST`)
- Created: `src/server/actions/project/getPublishableProjects.ts`
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (added
  Phase 4, 4.1-4.3 marked `[x]`, 4.4 left unchecked and annotated
  "GATE — pending, not run this batch")

### Not touched (per hard constraints)

`posts`, `postReplies`, `forums` in `schema.ts`; `ModalResumen.tsx`;
`AgentChatWidget.tsx`; everything under `src/components/`; and every
PR1/PR2/PR3a/PR3b/3c file listed above.

### Verification status (Batch 4)

No `npm run check`/`lint`/`typecheck`/`build`/`db:*` run per hard
constraints and validation-timing policy. No integrated-browser check
applies — this batch has no UI surface. Recommend, once the migration in
4.4 is approved and applied: `POST /api/community-posts` as an owner of a
private project (should succeed), as a non-owner of that same private
project (should 403), as anyone against a public project (should succeed),
and with no `projectId` at all (should succeed as a general publication);
then `GET /api/community-posts?limit=5` and confirm the author/project
shape and ordering.

### Not committed (Batch 4)

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 5 — Create Menu + Post Modal UI — DONE

Completed tasks (see `tasks.md` Phase 5, marked `[x]`):

- [x] 5.1 Created `src/lib/creation/createEntryBus.ts`: `requestCreateEntry`,
      `subscribeToCreateEntry`, `consumePendingCreateEntry`.

### Cross-tree mechanism chosen, and why (load-bearing decision)

The task offered two options: reuse `agentChatBus.ts`'s DOM `CustomEvent`
pattern, or navigate with a `?create=` query param. **Query param was
verified and rejected before writing any code**: `src/app/proyectos/page.tsx`
computes `hasLegacyQuery = Boolean(params && Object.keys(params).length > 0)`
and `redirect()`s to `/estudiantes` whenever it is true — ANY search param on
`/proyectos`, not just legacy ones. A `?create=project` navigation would have
been redirected away to `/estudiantes?create=project` before
`ProjectsSocialView` ever mounted, silently breaking the whole feature. This
was confirmed by reading the page file directly, not assumed from the task's
framing.

So the chosen mechanism is the DOM `CustomEvent` bus, matching
`agentChatBus.ts`'s pattern, **plus a `sessionStorage` fallback** for the
case the chat bus doesn't need: chat's `openAgentChatFor` only ever needs the
globally-mounted `AgentChatWidget` to be listening, which it always is. Here,
the listener (`ProjectsSocialView`) is NOT always mounted — it only exists on
`/proyectos`. A bare `CustomEvent` dispatched before navigating there would
have nobody listening yet and be lost. `requestCreateEntry()` therefore both
dispatches the event (for the case the listener is already mounted — see
below) AND writes the pending action to `sessionStorage` (for the
cross-route case); `ProjectsSocialView`'s mount effect calls
`consumePendingCreateEntry()` once, then subscribes to the live event for
as long as it stays mounted.

**Implemented identically for both platforms**, per the task's explicit ask:
desktop's `ProjectsLeftRail` "Crear" dropdown and `ProjectsSocialView`'s own
`handleCreateProject`/`handleCreatePost` call the exact same
`requestCreateEntry('project' | 'post')` function the mobile sheet calls —
even though desktop's listener is already mounted in the same tree and the
`sessionStorage` write is a no-op for it in practice. This was a deliberate
choice over giving desktop a shortcut direct `setState` call: one function,
one code path, used identically regardless of which of the two entry points
fired it.

- [x] 5.2 Created
      `src/components/estudiantes/proyectos/subcomponents/CreateMenuOptions.tsx`:
      the two "Crear" choices ("Proyecto" — `Layers` icon, `bg-primary/15`;
      "Post" — `FileText` icon, `bg-accent/15`), copy and classes matching
      the reference markup, shared verbatim by both surfaces below.
- [x] 5.3 In
      `src/components/estudiantes/proyectos/subcomponents/ProjectsLeftRail.tsx`:
      replaced the single gradient "Nuevo proyecto" button with a "Crear"
      toggle button (same gradient/shimmer treatment, relabeled) + dropdown
      (`CreateMenuOptions`) anchored via a wrapping `relative` container.
      Added `isCreateMenuOpen` state, a `createMenuRef`, and an effect that
      closes the menu on outside click (`mousedown` + `contains` check) and
      on `Escape`, only registered while open. Trigger has
      `aria-haspopup="menu"`/`aria-expanded`; the panel has
      `role="menu"`/`aria-label="Crear"`; both options are real `<button
    role="menuitem">` elements from `CreateMenuOptions`, reachable and
      activatable by keyboard with no extra wiring needed. Added the new
      `onCreatePost?: () => void` prop alongside the existing
      `onCreateProject?: () => void`; both close the menu before firing.
- [x] 5.4 Created `src/components/estudiantes/layout/MobileCreateSheet.tsx`:
      built directly on `@radix-ui/react-dialog` primitives (not the shared
      `estudiantes/ui/dialog.tsx`, which is tuned for a centered dialog) so
      it could slide up from the bottom instead. `z-[2147483001]`/
      `z-[2147483002]` (overlay/content) sit just above
      `MobileBottomNav`'s own `z-[2147483000]` wrapper. Radix gives
      Escape-to-close and backdrop-dismiss-on-tap for free; added
      `motion-reduce:animate-none motion-reduce:transition-none` on both the
      overlay and the content so `prefers-reduced-motion` users get an
      instant show/hide instead of the slide/fade. Content includes a
      sr-only `Title`/`Description` (Radix requires a `Title` for a11y) and
      a decorative drag-handle bar, then renders `CreateMenuOptions`.
- [x] 5.5 In `src/components/estudiantes/layout/MobileBottomNav.tsx`: the
      center "+" button (previously `{/* intentionally inert for now */}`
      with no `onClick`) now opens `MobileCreateSheet` via new
      `isCreateSheetOpen` state, with `aria-haspopup="dialog"`/
      `aria-expanded`. Selecting an option calls `requestCreateEntry(...)`
      then `router.push('/proyectos')` **only if not already there**
      (`pathname !== '/proyectos'`) — added `useRouter` alongside the
      existing `usePathname`. Works from any route because `MobileBottomNav`
      is mounted globally by `Header.tsx`, as the orchestrator's verified
      facts noted.
- [x] 5.6 Created
      `src/app/api/community-posts/publishable-projects/route.ts`: a thin
      auth-gated `GET` wrapper — `auth()` for the real session `userId`
      (401 if signed out), then `getPublishableProjects(userId)`. Written as
      a **new** file specifically because `getPublishableProjects` itself
      (which the hard constraints forbid modifying) trusts whatever `userId`
      string it is given with no internal auth check; calling it directly
      from a client component would have let anyone pass an arbitrary
      user id and see that user's private-project names mislabeled as
      `isOwner: true`. This wrapper is the safe boundary instead.
- [x] 5.7 Created
      `src/components/estudiantes/proyectos/subcomponents/CreatePostModal.tsx`:
  - Uses `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/
    `DialogDescription` from `~/components/estudiantes/ui/dialog` (same
    Radix-based primitive already used by `GuidedActivitySubmissionDialog.tsx`
    and others in this codebase) — its `DialogContent` already renders the
    top-right close button with an `sr-only` "Close" label, so no custom
    close control was added.
  - Author row: decorative avatar circle (`aria-hidden`, "Tú" monogram) +
    visible "Tú" name + a `Publicando en <destino>` selector button (`Globe`
    icon, `ChevronDown` that rotates when open).
  - Selector panel: `Buscar proyecto...` text filter (client-side
    `.filter()` on the fetched list), first entry always
    `Proyectos (publicación general)` (`Globe` icon, selecting it sets
    `selectedProject = null` → posts with no `projectId`), followed by
    `GET /api/community-posts/publishable-projects` results (`FolderKanban`
    icon, `truncate`d names). Selecting a project updates the button label
    and closes the panel.
  - Kind chips: `Ninguno` (no icon) | `Actualización` (`Zap`) | `Hito`
    (`Flame`) | `Solicitud` (`Users`), single-select via `kind` state
    defaulting to `'none'`, mapped 1:1 to the API's enum values.
  - Textarea: `min-h-[120px]`, `resize-none`, exact placeholder copy.
  - Image upload: a `<label>` wrapping a hidden `accept="image/*"` file
    input, reusing the exact same presigned-POST S3 flow as
    `ModalResumen.tsx`'s `handleMultimediaUpload` (fetch `/api/upload` for
    the presigned fields → `FormData` POST straight to S3) — re-derived
    inline here (not imported) since `ModalResumen.tsx` is on the
    do-not-modify list and its version is tangled with that component's own
    `multimedia[]` array state; this version keeps only the single
    `imageKey` the `communityPosts` schema actually has a column for. Shows
    the uploaded file name with a remove ("×") control once set.
  - Link button (`Link2`) toggles a small inline `type="url"` input for
    `linkUrl`, with its own remove control.
  - Footer right: submit button, exact reference label "Previsualizar"
    (shows "Publicando..." while in flight), `disabled` while
    `content.trim()` is empty or a submit is already in flight.
  - Submit: `POST /api/community-posts` with
    `{ content, kind, projectId: selectedProject?.id, imageKey, linkUrl }`.
    On success: closes the modal, then `router.refresh()` (never
    `window.location.reload()`, matching every other soft-refresh
    convention this whole change has followed since PR3b). On failure:
    parses the server's JSON `{ error }` body and shows it via `sonner`'s
    `toast.error(...)`, falling back to a generic Spanish message only if
    the response body couldn't be parsed at all — errors are never
    swallowed.
  - State resets to blank on every `isOpen` transition to `true` (content,
    kind, link, image, selected project, filter query), mirroring
    `ModalResumen`'s own `isOpen`-keyed reset effect noted in this file's
    Batch 3b/3c entries.
- [x] 5.8 In `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`:
      added `isPostModalOpen` state and the mount effect described in 5.1
      (`consumePendingCreateEntry()` once, then `subscribeToCreateEntry`
      for the component's lifetime). `handleCreateProject` changed from a
      direct `setIsCreateModalOpen(true)` to `requestCreateEntry('project')`
      (now routes through the same subscription instead of setting state
      directly — see the 5.1 rationale for why); added the sibling
      `handleCreatePost`. Wired `onCreatePost={handleCreatePost}` onto
      `ProjectsLeftRail`, and mounted `<CreatePostModal isOpen=
    {isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />`
      alongside the two existing `ModalResumen` instances.

### Files changed (Batch 5)

- Created: `src/lib/creation/createEntryBus.ts`
- Created:
  `src/components/estudiantes/proyectos/subcomponents/CreateMenuOptions.tsx`
- Created: `src/components/estudiantes/layout/MobileCreateSheet.tsx`
- Created: `src/app/api/community-posts/publishable-projects/route.ts`
- Created:
  `src/components/estudiantes/proyectos/subcomponents/CreatePostModal.tsx`
- Modified:
  `src/components/estudiantes/proyectos/subcomponents/ProjectsLeftRail.tsx`
  (dropdown, `onCreatePost` prop)
- Modified: `src/components/estudiantes/layout/MobileBottomNav.tsx` (wired
  the center "+" button, mounted the sheet)
- Modified: `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`
  (`isPostModalOpen`, bus wiring, `CreatePostModal` mount)
- Modified: `openspec/changes/user-projects-and-student-ux/tasks.md` (added
  Phase 5, 5.1-5.8 marked `[x]`)

### Not touched (per hard constraints)

`src/server/db/schema.ts`, `src/app/api/community-posts/route.ts`,
`getPublishableProjects.ts`, `ModalResumen.tsx`, `AgentChatWidget.tsx`,
everything under `drizzle/`, and every PR1/PR2/PR3a/PR3b/3c/Batch4 file
listed above. No `db:*` command was run (the `community_posts` migration
from Phase 4 is still pending — posting will 500 against the real database
until it lands; this was not fixed here, it is unrelated to this batch's
scope, and the UI surfaces the resulting server error via the toast rather
than swallowing it).

### Verification status (Batch 5)

No `npm run check`/`lint`/`typecheck`/`build` run per validation-timing
policy. No integrated-browser check was performed — no browser tool was
available in this session's toolset (confirmed by checking the tool list
before starting, not assumed). Recommend, once convenient: on desktop
`/proyectos`, click "Crear", confirm the dropdown opens with "Proyecto"/
"Post", closes on outside click/Escape, and each option opens its modal;
resize to a mobile viewport (or a real device), tap the bottom nav's "+",
confirm the sheet slides up with the same two options, and confirm tapping
either option from a **different** route (e.g. `/estudiantes`) correctly
navigates to `/proyectos` and opens the right modal there. In
`CreatePostModal`, exercise the project selector's search filter, each kind
chip, an image upload, an attached link, and both the disabled-until-content
and error-toast paths (the latter will currently always fire, since
`community_posts` has no live table yet).

### Not committed (Batch 5)

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit.

## Batch 6 — Project Feedback Threads: Schema + API (SCHEMA + API ONLY, no UI) — DONE

Completed tasks (see `tasks.md` Phase 6, marked `[x]`): 6.1, 6.2. CODE ONLY —
no `db:*` command run, not committed.

### Schema (`src/server/db/schema.ts`)

Added `AnyPgColumn` to the `drizzle-orm/pg-core` type import, and the new
table right after `projectComments`:

```ts
export const projectFeedback = pgTable(
  'project_feedback',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    parentId: integer('parent_id').references(
      (): AnyPgColumn => projectFeedback.id,
      { onDelete: 'cascade' }
    ),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    authorRole: text('author_role', {
      enum: ['estudiante', 'educador', 'admin', 'super-admin'],
    }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('project_feedback_project_idx').on(table.projectId),
    index('project_feedback_parent_idx').on(table.parentId),
  ]
);
```

Plus `projectFeedbackRelations` (project, user, self `parent`/`replies` via
a shared `relationName: 'projectFeedbackReplies'`), and
`projectFeedback: many(projectFeedback)` added to both `usersRelations` and
`projectsRelations`. `projectComments` itself was left completely untouched,
per the hard constraint.

### API (`src/app/api/projects/[id]/feedback/route.ts`)

**Deviation from the requested path**: the task specified
`src/app/api/projects/[projectId]/feedback/route.ts`, but the sibling routes
under `src/app/api/projects/` already use the dynamic segment name `[id]`
(`[id]/comments`, `[id]/likes`, `[id]/follows`, `[id]/shares`, `[id]/route.ts`,
etc.). Next.js App Router requires every dynamic segment at the same route
level to share one slug name — mixing `[id]` and `[projectId]` under
`/api/projects/*` throws a build-time routing error
("You cannot use different slug names for the same dynamic path"). The route
was created at `src/app/api/projects/[id]/feedback/route.ts` instead, matching
the existing convention; this is a path-only change, the URL shape
(`/api/projects/<id>/feedback`) is identical to what was requested.

- **Permission model**: `getApiSession()`/role checks from
  `~/server/utils/apiAuth.ts` reused as instructed; no role logic
  re-implemented. `resolveProjectAccess()` resolves project ownership
  (`projects.userId`) and collaborator status (`projectsTaken`) once per
  request.
- **`GET`**: 401 if unauthenticated; 404 if the project doesn't exist; 403
  unless the caller is the owner, a collaborator, or staff
  (`session.isStaff` — `educador`/`admin`/`super-admin`, reused from
  `apiAuth.ts`). Returns `{ items: [...] }`, each item a root feedback entry
  with a nested `replies` array, joined with the author's name and the
  **snapshot** `authorRole` (not a live role join).
- **`POST`**: zod schema `{ content: string (trim, min 1, max 2000),
parentId?: coerced positive int }`. Depth cap: if `parentId` points at a
  row that is itself a reply (has its own `parentId`), the new row is
  re-parented onto that reply's root (`effectiveParentId = parent.parentId
?? parent.id`) rather than nesting further, and rather than rejecting —
  chosen because it matches the described YouTube/Facebook UX (replying to a
  reply keeps the conversation in one visible thread instead of erroring).
  A `parentId` belonging to a different project is rejected with 400, never
  silently accepted. Root creation requires `ROOT_FEEDBACK_ROLES`; replies
  require owner/collaborator/`REPLY_STAFF_ROLES`.

### Root ordering and named-constant confirmations (as requested)

- **Root ordering chosen: newest-first.** Rationale: this is a feedback log
  on a specific project, read the same way the existing social feed
  (`community_posts`, `GET /api/community-posts`) already reads — newest
  first lets the owner/staff see the latest observation without scrolling.
  Replies within a root are chronological, oldest-first (natural
  conversation reading order), which falls out for free from selecting the
  whole table `ORDER BY createdAt ASC` once and only re-sorting the roots.
- **Depth-cap behaviour chosen: re-parent, not reject** (see above).
- **`admin`-excluded-from-root-comments is a single named constant**:
  `ROOT_FEEDBACK_ROLES: readonly Roles[] = ['educador', 'super-admin']`
  (top of the route file). Confirmed one-line change if that decision
  changes.
- **Additional, unprompted-but-literal reading of the spec**: the reply
  permission list in the task ("the project OWNER, any collaborator ...,
  `educador`, and `super-admin`") also omits `admin` — unlike the read
  permission, which explicitly lists `admin`. This was implemented literally
  as a second named constant, `REPLY_STAFF_ROLES` (same two roles), kept
  separate from `ROOT_FEEDBACK_ROLES` and from `apiAuth.ts`'s `STAFF_ROLES`
  (which does include `admin`) so this asymmetry is a single, clearly
  commented, isolated point per role list. Flagging this explicitly in case
  it was accidental in the original request rather than intentional.

### Not touched (per hard constraints)

`projectComments`, `communityPosts`, `ModalResumen.tsx`,
`AgentChatWidget.tsx`, everything under `drizzle/`, and no UI component was
added. No `db:*` command was run — `project_feedback` exists in code only,
not in the database, until a migration is generated and applied (separate
approval-gated step, same pattern as `community_posts` in Phase 4).

### Verification status (Batch 6)

No `npm run check`/`lint`/`typecheck`/`build` run per validation-timing
policy (schema/API changes normally warrant a targeted check, but this batch
explicitly prohibits running any command beyond edits). No integrated
browser check — this slice has no UI. Manual review: reread the full route
file after edits for permission-branch correctness and import formatting.

### Not committed (Batch 6)

Per hard constraints, no commit/push/PR was created. Changes are in the
working tree only, awaiting user-approved commit and a separately
approved migration for `project_feedback` before this table can be used in
production.
