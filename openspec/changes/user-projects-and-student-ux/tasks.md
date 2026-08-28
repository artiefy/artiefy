# Tasks: User Projects and Student UX Batch

## Review Workload Forecast

| Field                   | Value                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Estimated changed lines | PR1 ~250-300, PR2 ~350-450, PR3a ~150-220, PR3b ~150-250 (total ~900-1200)          |
| 800-line budget risk    | Low per slice; Medium in aggregate                                                  |
| Chained PRs recommended | Yes                                                                                 |
| Suggested split         | PR1 (navigation) → PR2 (chat UX) → PR3a (projects UI) → PR3b (migration + chat API) |
| Delivery strategy       | auto-chain                                                                          |
| Chain strategy          | stacked-to-main                                                                     |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
800-line budget risk: Low

### Suggested Work Units

| Unit | Goal                                       | Likely PR | Focused test command                                                              | Runtime harness                                                                                                     | Rollback boundary                                                          |
| ---- | ------------------------------------------ | --------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | Single top-nav next affordance, both views | PR 1      | N/A (no test runner); manual: `npm run dev` → open a lesson and a guided activity | Integrated browser at `/estudiantes/clases/[id]` and `/estudiantes/proyectos-guiados/[id]/actividades/[activityId]` | Revert PR1 commit; no schema/API touched                                   |
| 2    | Reveal + expand + quota copy               | PR 2      | N/A; manual: open chat, send message, toggle expand, exhaust quota (3 tiers)      | Integrated browser, `AgentChatWidget` mounted route                                                                 | Revert PR2 commit; additive client-only state                              |
| 3    | Feed clamp + wizard wiring                 | PR 3a     | N/A; manual: `/proyectos` feed + "+ Nuevo proyecto" full 8-step flow              | Integrated browser at `/proyectos`                                                                                  | Revert PR3a commit; no schema change                                       |
| 4    | `type` column + owner-scoped chat API      | PR 3b     | N/A; manual: query `information_schema.columns`, chat as owner vs non-owner       | Neon SQL editor + integrated browser                                                                                | Code revert is safe; additive column may stay if migration already applied |

## Phase 1: Navigation (PR 1, no migration)

- [x] 1.1 Delete `src/components/estudiantes/layout/lessondetail/NextLessonModal.tsx` (sole importer removed in 1.2).
- [x] 1.2 In `src/app/estudiantes/clases/[id]/LessonDetails.tsx`, remove the `NextLessonModal` import and the render block (~lines 1104-1123, its IIFE).
- [x] 1.3 In `src/components/estudiantes/layout/lessondetail/LessonNavigation.tsx`, restyle the next control to `bg-primary text-background` (prev stays ghost); preserve click/keyboard/disabled behavior.
- [x] 1.4 In `src/components/estudiantes/proyectos/GuidedActivityDetails.tsx`, remove the floating "Siguiente" pill block (~lines 897-914) and restyle the top-nav next `Button` (~lines 535-548) from `ghost` to `variant="default"` plus explicit `bg-primary text-background` (the codebase's `default` Button variant is unstyled/empty, so explicit classes were required for visible prominence).

## Phase 2: Agent Chat UX (PR 2, no migration)

- [x] 2.1 Create `src/hooks/useMessageReveal.ts`: rAF-driven cursor, word-boundary steps, ~40ms commit cadence, rate `max(900 chars/s, length/2.2s)`, instant under `prefers-reduced-motion`, cancelable on new turn.
- [x] 2.2 Create `src/components/agents/AgentRevealedContent.tsx`: wraps `AgentMessageContent`, owns reveal state via `useMessageReveal`, calls `onRevealTick` to re-pin scroll imperatively; renders instantly when the message contains a ` ``` ` code fence.
- [x] 2.3 In `src/components/agents/AgentChatWidget.tsx`, add `revealingId` state; render bubbles through `AgentRevealedContent`; cancel the in-progress reveal when a new turn starts.
- [x] 2.4 In `src/components/agents/AgentChatWidget.tsx`, add an expand button (`Maximize2`/`Minimize2`) left of the agent-switch icon, `isExpanded` state, and a portal to `document.body` (z-60 → z-[100010]) when expanded and not popped out; leave `panelRect`, `pipWindow`, `togglePopOut` untouched.
- [x] 2.5 In `src/components/agents/AgentChatWidget.tsx`, update `buildQuotaNotice()`: replace "mensajes" with "intentos" (grammatically agreeing) in the anonymous, free, and premium tiers.

## Phase 3a: Projects UI (PR 3a, no migration)

- [x] 3a.1 In `src/components/estudiantes/proyectos/subcomponents/ProjectFeedCard.tsx`, clamp the description: split on `/\n\s*\n/`, show first 3 paragraphs + "Ver más" revealing the rest in place; fallback to `line-clamp-6` + "Ver más" when no paragraph structure is detected and content overflows.
- [x] 3a.2 In `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`, wire `onCreateProject` on `ProjectsLeftRail` to a second `ModalResumen` instance with `courseId={undefined}`. (Scoped to PR3a: opening the coach chat via `openAgentChatFor()` after save is PR3b territory — `agentChatBus.ts`'s `source` field and the chat route's user-project resolution don't exist yet — so it is deferred to task 3b.7/next PR, not done here.) Cancel-without-save leaves the button reusable and creates no row.

## Phase 3b: Migration + Chat API (PR 3b — carries the migration; APPROVAL GATE)

**No `db:*` command runs without explicit user go-ahead. `npm run db:migrate` hangs here — apply via neon-http.**

- [x] 3b.1 In `src/server/db/schema.ts`, add `type: text('type', { enum: ['course','user'] }).default('course').notNull()` to the `projects` table.
- [ ] 3b.2 **[GATE — ask user first, AWAITING USER APPROVAL]** Run `npm run db:generate` to produce `drizzle/0011_*.sql`.
- [ ] 3b.3 **[GATE — ask user first, AWAITING USER APPROVAL]** Apply via neon-http on `POSTGRES_URL_NON_POOLING`, in order: (a) `ALTER TABLE "projects" ADD COLUMN "type" text;` (b) `UPDATE "projects" SET "type" = CASE WHEN "course_id" IS NULL THEN 'user' ELSE 'course' END;` (c) `ALTER TABLE "projects" ALTER COLUMN "type" SET NOT NULL;` (d) `ALTER TABLE "projects" ALTER COLUMN "type" SET DEFAULT 'course';` — the flat `DEFAULT 'course'` NOT NULL in one statement is WRONG for courseless rows; register the hash in `drizzle.__drizzle_migrations` (`created_at = journal.when`), verify via `information_schema.columns`, delete the throwaway script.
- [x] 3b.4 In `src/server/actions/project/createProject.ts`, persist `type: projectData.type ?? (projectData.courseId ? 'course' : 'user')`.
- [x] 3b.5 In `src/app/api/projects/route.ts`, pass `type` through.
- [x] 3b.6 In `src/lib/agents/agentChatBus.ts`, extend the project scope to `{ kind: 'project'; id; title; source?: 'guided' | 'user' }`.
- [x] 3b.7 In `src/app/api/agents/chat/route.ts`, resolve project context: `guidedProjects` first (premium gate unchanged); else look up `projects`, reject when `projects.userId` does not match the session user (existing entitlement-rejection behavior), else `buildUserProjectContext()`; store `projectSource: 'user'` in the persisted scope; send `null` `projectId` to n8n for user projects.

## Phase 3c: Courseless Project Workspace (continuation, no migration)

A student who creates a project from `/proyectos` (no course) needs the same
"Trabajar" workspace a course-linked project gets — the tabbed
`ProjectDetailView` with per-section pencils reopening `ModalResumen` at that
step — instead of "Trabajar" and "Publicar avance" pointing at the same
read-only public detail page.

- [x] 3c.1 Create `src/app/estudiantes/proyectos/[id]/trabajar/page.tsx`: owner-only
      server route. Resolves `params`, coerces the id, `notFound()` on a bad
      id or when there is no signed-in user, no project, or
      `project.userId !== userId` (does not leak existence to a non-owner);
      fetches via `getProjectById`; renders `UserProjectWorkspace` + `Footer`,
      carrying the repo's `export const instant = false;` opt-out comment.
- [x] 3c.2 Create `src/components/estudiantes/proyectos/UserProjectWorkspace.tsx`:
      client component rendering `ProjectDetailView` for the fetched project,
      wiring `onEditSection` to open `ModalResumen` at that step exactly like
      `ProjectsSection.tsx`, with `courseId={undefined}` and
      `projectId={project.id}` so the wizard EDITS the existing project
      instead of creating a duplicate; `router.refresh()` (not
      `window.location.reload()`) on modal close; a "Volver a proyectos" link
      back to `/proyectos`.
- [x] 3c.3 Point "Trabajar" at the new route: `ProjectsSocialView.tsx` gets a
      `getWorkHref()` (courseless → `/estudiantes/proyectos/${id}/trabajar`,
      course-linked → unchanged course workspace href), leaving
      `getPublishHref()`/`publishHref` untouched; `ProfileView.tsx` gets the
      equivalent `projectWorkHref()` split from its shared `projectHref()`
      helper, applied only to `workHref`.

## Phase 4: Community Posts — Schema + API (continuation, no UI, migration pending)

Social publications for the `/proyectos` feed, decoupled from the existing
course-forum `posts`/`postReplies` tables (left untouched). Schema-only in
this batch — no `db:*` command was run; the column/table exist in code but
not yet in the database.

- [x] 4.1 In `src/server/db/schema.ts`, add `communityPosts` table
      (`community_posts`): `id` serial PK; `userId` text → `users.id`
      not null; `projectId` integer → `projects.id`, nullable, `onDelete:
    'set null'` (a deleted project degrades the post to a general
      publication instead of orphaning/crashing the feed); `kind` text enum
      `['none','update','milestone','request']` default `'none'` not null;
      `content` text not null; `imageKey` text nullable; `linkUrl` text
      nullable; `createdAt`/`updatedAt` timestamps matching the
      `forums`/`postReplies` convention (`updatedAt` has `$onUpdateFn`). Added
      `communityPostsRelations` (`user`, `project`) grouped with the other
      post-like relations.
- [x] 4.2 Create `src/app/api/community-posts/route.ts`: `POST` — Clerk
      `auth()` (401 when signed out), zod-validated body (`content`
      trimmed/non-empty/max 2000, `kind` enum, optional `projectId`
      coerced to a positive int, optional `imageKey`, optional `linkUrl`
      validated as a URL); when `projectId` is present, looks up the
      project and requires `project.userId === userId || project.isPublic`
      (403 otherwise, 404 if the project doesn't exist) — never trusts the
      client. `GET` — public feed listing, newest first, inner-joined with
      `users` (author) and left-joined with `projects` (nullable), `limit`
      query param clamped to `[1, 50]` (default 20).
- [x] 4.3 Create `src/server/actions/project/getPublishableProjects.ts`:
      returns projects a user may attach a publication to — every project
      they own (public or private) plus every other public project,
      deduplicated by id, `{ id, name, isOwner }`, owner's projects first
      then by most recently updated. Backs the post-composer's "Buscar
      proyecto..." selector (selector UI itself is out of scope for this
      batch).
- [ ] 4.4 **[GATE — pending, not run this batch]** Generate + apply the
      migration for `community_posts` (`db:generate` then apply; same
      approval gate as 3b.2/3b.3) before this table can be used in
      production.

## Phase 5: Create Menu + Post Modal UI (continuation, no migration)

Wires the `communityPosts` schema/API from Phase 4 to actual UI: a "Crear"
menu (desktop dropdown + mobile bottom sheet) offering "Proyecto"/"Post", and
the "Crear publicación" modal itself.

- [x] 5.1 `src/lib/creation/createEntryBus.ts` (new): `requestCreateEntry`,
      `subscribeToCreateEntry`, `consumePendingCreateEntry` — DOM
      `CustomEvent` bus (same pattern as `agentChatBus.ts`) plus a
      `sessionStorage` fallback for cross-route delivery. Chosen over a
      `?create=` query param because `src/app/proyectos/page.tsx` redirects
      to `/estudiantes` whenever it sees ANY search param
      (`hasLegacyQuery`), which would have bounced the user away before
      `ProjectsSocialView` ever mounted.
- [x] 5.2 `src/components/estudiantes/proyectos/subcomponents/CreateMenuOptions.tsx`
      (new): the two "Crear" choices ("Proyecto"/"Post", copy + icons)
      shared verbatim by the desktop dropdown and the mobile sheet.
- [x] 5.3 `src/components/estudiantes/proyectos/subcomponents/ProjectsLeftRail.tsx`:
      replaced the single "Nuevo proyecto" button with a "Crear" toggle +
      dropdown (`CreateMenuOptions`); outside-click + Escape close;
      `aria-haspopup`/`aria-expanded` on the trigger. New `onCreatePost` prop
      alongside the existing `onCreateProject`.
- [x] 5.4 `src/components/estudiantes/layout/MobileCreateSheet.tsx` (new):
      Radix-primitive bottom sheet (slide-in-from-bottom, backdrop dismiss,
      Escape close, `motion-reduce` override), sitting above
      `MobileBottomNav`'s `z-[2147483000]`.
- [x] 5.5 `src/components/estudiantes/layout/MobileBottomNav.tsx`: wired the
      previously-inert center "+" button to open `MobileCreateSheet`;
      selecting an option calls `requestCreateEntry` then navigates to
      `/proyectos` (no query string) if not already there.
- [x] 5.6 `src/app/api/community-posts/publishable-projects/route.ts` (new):
      auth-gated GET wrapper around `getPublishableProjects` — that action
      trusts whatever `userId` it receives, so it must never be called
      directly from client code with an unverified id.
- [x] 5.7 `src/components/estudiantes/proyectos/subcomponents/CreatePostModal.tsx`
      (new): "Crear publicación" dialog — target selector (general feed vs.
      one of the user's publishable projects, with a text filter), kind
      chips (Ninguno/Actualización/Hito/Solicitud), textarea, image upload
      reusing the `/api/upload` presigned-POST flow, optional link URL,
      submits to `POST /api/community-posts`, Spanish-toast on failure,
      `router.refresh()` on success.
- [x] 5.8 `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`: added
      `isPostModalOpen` state, mounted `CreatePostModal`, and a mount effect
      that both consumes any pending `sessionStorage` request and subscribes
      to the live bus event — the single code path both desktop and mobile
      route through.

## Phase 6: Project Feedback Threads — Schema + API (continuation, no UI, migration pending)

Threaded feedback on a project (YouTube/Facebook-style: root comment + one
level of replies), distinct from the flat social-feed `projectComments`.
Not public — restricted to the project owner, its collaborators, and staff.
Schema-only in this batch — no `db:*` command was run.

- [x] 6.1 In `src/server/db/schema.ts`, add `projectFeedback` table
      (`project_feedback`), placed next to `projectComments`: `id` serial PK;
      `projectId` integer → `projects.id`, `onDelete: 'cascade'`, not null;
      `parentId` integer, self-reference to `projectFeedback.id` (explicit
      `AnyPgColumn` return-type annotation, imported from
      `drizzle-orm/pg-core`), nullable, `onDelete: 'cascade'`; `userId` text
      → `users.id`, `onDelete: 'cascade'`, not null; `authorRole` text with
      the same 4-value enum as `users.role`, not null — a SNAPSHOT of the
      author's role at write time (not a live join) so the UI can badge
      "Educador" correctly even after that person's role changes later;
      `content` text not null; `createdAt`/`updatedAt` timestamps matching
      neighbouring tables. Indexes on `projectId` and `parentId` (the thread
      read is `where projectId = ?` then grouped by parent). Added
      `projectFeedbackRelations` (`project`, `user`, self `parent`/`replies`
      via `relationName`) and `projectFeedback: many(...)` on
      `usersRelations`/`projectsRelations`.
- [x] 6.2 Create `src/app/api/projects/[id]/feedback/route.ts` (task said
      `[projectId]`; used the existing `[id]` sibling segment instead — see
      deviation note below). `GET` — returns the whole thread tree: roots
      newest-first, each with its replies in chronological order, author
      name + snapshot `authorRole` joined in; enforces read permission
      (owner, collaborator via `projectsTaken`, or staff
      `educador`/`admin`/`super-admin`) — 401 unauthenticated, 403
      unauthorized. `POST` — zod-validated body (`content`
      trimmed/non-empty/max 2000, optional `parentId` coerced positive int);
      root creation restricted to `ROOT_FEEDBACK_ROLES` (`educador`,
      `super-admin` — single named constant, `admin` intentionally
      excluded per spec); replies restricted to owner, collaborator, or
      `REPLY_STAFF_ROLES` (`educador`, `super-admin` — `admin` excluded
      here too, per the literal spec, unlike the read permission which
      does include it); depth capped at 2 by re-parenting a reply-to-a-reply
      onto that reply's root; rejects a `parentId` belonging to another
      project (400, not silently accepted).
- [x] 6.3 Create `src/components/estudiantes/projects/ProjectFeedbackThread.tsx`
      (new) and render it from `ProjectDetailView.tsx`'s
      `<TabsContent value="feedback">` (previously a static placeholder),
      passing `projectId={project.id}`. Fetches the thread tree via `useSWR`
      against `GET /api/projects/[id]/feedback`; root cards show an initial
      avatar, author name, a role badge derived from the stored snapshot
      role, a Spanish relative timestamp, and content; replies render
      indented (smaller avatar, left border) in chronological order. A
      "Iniciar retroalimentación" composer is shown only when the viewer's
      Clerk `publicMetadata.role` is `educador`/`super-admin` (mirrors
      `ROOT_FEEDBACK_ROLES`, a reliable client-side check since it does not
      depend on project ownership). "Responder" is shown to any signed-in
      viewer — the API does not expose the viewer's owner/collaborator
      status in its `GET` response, so this is deliberately optimistic; the
      server remains the sole authority and its 403 Spanish message is
      surfaced via `toast` on rejection. Submit buttons disable while empty
      or in-flight with a pending label; failures never fail silently
      (`toast.error`); empty state tells staff viewers they can start the
      thread. Real `<button>`s, a labelled reply textarea (`sr-only`
      `<label>`), `focus-visible` rings, and `aria-expanded`/`aria-controls`
      linking "Responder" to its reply region.
