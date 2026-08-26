# Design: User Projects and Student UX Batch

Phase: sdd-design · Inputs: `proposal.md`, `exploration.md` (+ orchestrator corrections)

## Technical Approach

Three independent seams, no shared abstraction invented. Navigation and quota copy
are local edits. Chat gains two additive client concerns (reveal, expand) that never
mutate existing panel state. Projects gains one additive column, one API resolution
branch, and one wizard host. `/proyectos` stays a public feed: visibility rules are
untouched; only the coach chat is owner-scoped.

## Architecture Decisions

| #   | Decision             | Chosen                                                                                       | Rejected (why)                                                                                                                            |
| --- | -------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Reveal transport     | Client typewriter over the settled reply                                                     | Network/SSE streaming — n8n support unverified, out of scope                                                                              |
| D2  | Reveal ownership     | State lives in a leaf `AgentRevealedContent`; the widget's `messages.map` never re-renders   | Reveal state in `AgentChatWidget` — re-renders every bubble per tick                                                                      |
| D3  | Code answers         | Messages containing ` ``` ` render instantly                                                 | Segment-aware reveal — remounts the dynamically imported `AgentCodeBlock` per tick                                                        |
| D4  | Expand stacking      | Portal the panel to `document.body` whenever not popped out, then swap `z-60` → `z-[100010]` | Raise z-index in place — the guided-project route mounts its own widget inside a glass/transform subtree that can trap a stacking context |
| D5  | Expand state         | Additive `isExpanded`; `panelRect`, `pipWindow`, `togglePopOut` untouched                    | Clearing geometry on expand — collapse could not restore the previous panel                                                               |
| D6  | Discriminator        | `projects.type` (`course` \| `user`), non-authoritative for access                           | `courseId IS NULL` — also true for legacy rows                                                                                            |
| D7  | Project id collision | Guided lookup first; optional `projectSource` hint short-circuits to the user table          | Merged id space or a new bus scope kind (out of scope)                                                                                    |
| D8  | Wizard host          | A second `ModalResumen`, conditionally mounted for creation                                  | One instance with a mode flag — leaks edit state                                                                                          |

## Data Flow — chat project resolution

    widget → POST /api/agents/chat { projectId, projectSource? }
       │
       ├ projectSource === 'user' ──→ projects (owner check) ─→ user context
       └ otherwise ─→ getGuidedProjectById (premium gate UNCHANGED)
                        ├ found  → guided context, session `${uid}:project:${id}`
                        └ null   → projects (owner check) → session `${uid}:userproject:${id}`
                                     └ not owner → existing 403 notice

Rules: the guided branch and its `!project?.enrolled` 403 are byte-identical to today.
Only ids absent from `guidedProjects` reach the new branch. `projectSource: 'user'` is
persisted in the stored scope, so restored conversations keep resolving correctly;
absent (legacy history) falls back to guided-first, whose worst case is today's 403 —
never a cross-owner leak. The n8n payload keeps `projectId` for guided only and sends
`null` for user projects, so the RAG step cannot read a colliding guided document.

## File Changes

| File                                                | Action | Change                                                                                                                                                                  |
| --------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.../lessondetail/NextLessonModal.tsx`              | Delete | Dead once unrendered; keeping it invites re-introduction                                                                                                                |
| `src/app/estudiantes/clases/[id]/LessonDetails.tsx` | Modify | Drop the import and the `1104-1123` block (its IIFE goes with it)                                                                                                       |
| `.../lessondetail/LessonNavigation.tsx`             | Modify | Next button becomes accent-filled (`bg-primary text-background`), prev stays ghost                                                                                      |
| `.../proyectos/GuidedActivityDetails.tsx`           | Modify | Remove the `897-914` pill; next `Button` → `variant="default"`                                                                                                          |
| `src/hooks/useMessageReveal.ts`                     | Create | rAF cursor, word-boundary steps, ~40 ms commits, instant on `prefers-reduced-motion`                                                                                    |
| `src/components/agents/AgentRevealedContent.tsx`    | Create | Wraps `AgentMessageContent`; owns reveal state; `onRevealTick` re-pins scroll imperatively                                                                              |
| `src/components/agents/AgentChatWidget.tsx`         | Modify | `revealingId`; expand button left of the agent switch (`Maximize2`/`Minimize2`); portal; `isExpanded`; "mensajes" → "intentos" in all three tiers of `buildQuotaNotice` |
| `src/server/db/schema.ts`                           | Modify | `type: text('type', { enum: ['course','user'] }).default('course').notNull()` on `projects`                                                                             |
| `drizzle/0011_*.sql`                                | Create | `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'course' NOT NULL;`                                                                                |
| `src/server/actions/project/createProject.ts`       | Modify | `type: projectData.type ?? (projectData.courseId ? 'course' : 'user')`                                                                                                  |
| `src/app/api/projects/route.ts`                     | Modify | Pass `type` through                                                                                                                                                     |
| `src/app/api/agents/chat/route.ts`                  | Modify | Resolution above + `buildUserProjectContext()`                                                                                                                          |
| `src/lib/agents/agentChatBus.ts`                    | Modify | `{ kind: 'project'; id; title; source?: 'guided' \| 'user' }`                                                                                                           |
| `.../proyectos/ProjectsSocialView.tsx`              | Modify | `onCreateProject`, create-modal instance, `openAgentChatFor` on close after save                                                                                        |
| `.../subcomponents/ProjectFeedCard.tsx`             | Modify | Clamp + "Ver más"                                                                                                                                                       |

Reveal rate: `max(900 chars/s, length / 2.2 s)` — long answers still finish in ≈2.2 s.
Clamp: split on `/\n\s*\n/`; >3 paragraphs → first 3 + "Ver más"; unstructured single
block → `line-clamp-6` fallback.

## Wizard audit (C10) — resolved

`courseId` occurs in `ModalResumen.tsx` only at the props and in the step-1 create
payload. Steps 2–8 key every write on `projectId` (`/api/projects/[id]`,
`/api/project-sections-save`, `/api/projects/taken*`); `ModalInvitarIntegrante` uses
`/api/users` + `/api/projects/invitaciones`; categories and project types are global.
`courseId` is nullable end to end (column, route `?? undefined`, action `?? null`).
No step assumes a course.

## Testing Strategy

No test runner (`strict_tdd: false`). Gate is `npm run check` at the authorized
commit only, plus manual verification in the integrated browser: both nav views,
reveal (normal + reduced motion), expand/collapse over header dropdowns, quota copy,
feed clamp, wizard save with no course, and the coach chat answering about it.

## Threat Matrix

N/A — no shell, subprocess, VCS automation, or executable-file classification. The
only new boundary is the chat route's owner check, covered by D7.

## Migration / Rollout

User-approved neon-http path (`npm run db:migrate` hangs here): `npm run db:generate`,
apply the SQL with `neon()` on `POSTGRES_URL_NON_POOLING`, insert
`drizzle.__drizzle_migrations (hash = sha256(sql), created_at = journal.when)`, verify
via `information_schema.columns`, delete the throwaway script. The `DEFAULT 'course'`
backfills every existing row in the same statement. Additive and safe to leave on revert.

## Open Questions

- [ ] Backfill labels `course_id IS NULL` rows as `course` (per decision). Confirm, or
      switch to `CASE WHEN course_id IS NULL THEN 'user' ELSE 'course' END`.
