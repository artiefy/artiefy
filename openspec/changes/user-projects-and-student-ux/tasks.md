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
