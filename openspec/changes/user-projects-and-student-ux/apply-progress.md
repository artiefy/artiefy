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
