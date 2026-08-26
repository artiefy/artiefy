# Proposal: User Projects and Student UX Batch

Phase: sdd-propose · Source: `exploration.md` (Engram observation 879)

## Intent

Students hit three friction points in the same session. (1) A floating "next" pill
overlaps content in lesson and guided-activity views while the real top-nav arrow is
almost invisible. (2) The AI chat dumps whole answers at once, cannot be enlarged
(the site header always covers it), and calls quota "mensajes" when it actually
counts attempts. (3) `/proyectos` advertises `+ Nuevo proyecto` but the button is
wired to nothing, so a student cannot own a project outside a course, and the chat
API cannot talk about one if they could.

## Scope

### In Scope

- **Navigation** — remove both floating pills (`NextLessonModal.tsx`, inline block in
  `GuidedActivityDetails.tsx`); restyle the top-nav next arrow in both views.
- **Chat** — client-side progressive reveal of the completed answer; re-add an
  expand control left of the agent-switch icon that goes full-window above the
  header; "mensajes" → "intentos" in all three tiers of `buildQuotaNotice()`.
- **Projects** — clamp the feed description to ~3 paragraphs with "ver más"; add an
  explicit `type` discriminator to `projects`; wire `onCreateProject` to a
  `ModalResumen` with `courseId={undefined}`; open a project-scoped chat after save
  and resolve user projects in the chat API.

### Out of Scope

- True network/SSE streaming from the n8n webhook (support unverified).
- Removing or reworking the existing `togglePopOut` PictureInPicture control.
- Any new scope kind in `agentChatBus`; any i18n layer; any test runner.
- Sharing, permissions, or collaboration on user projects beyond owner access.

## Capabilities

### New Capabilities

- `user-projects`: standalone user-owned project creation, `type` discriminator,
  owner-scoped access, and post-creation agent chat.
- `agent-chat-ux`: response reveal, full-window expand above header, quota copy.
- `lesson-navigation`: single top-nav next affordance for lessons and activities.

### Modified Capabilities

- None. No requirement in `openspec/specs/estudiantes/spec.md` changes.

## Approach

Three independent seams. Navigation and quota copy are local edits. The reveal is a
client hook over the settled assistant message, instant under
`prefers-reduced-motion`. Expand raises the panel above `z-[100000]` (portal if the
stacking context blocks it). Projects reuses the existing 8-step wizard unchanged;
the backend adds a nullable-with-default `type` column plus an owner check in the
chat route's project branch, extended to resolve `guidedProjects` first (premium
gate preserved) and then `projects`.

## Affected Areas

| Area                                                        | Impact   | Description                        |
| ----------------------------------------------------------- | -------- | ---------------------------------- |
| `.../lessondetail/NextLessonModal.tsx`, `LessonDetails.tsx` | Removed  | Pill + render call                 |
| `.../lessondetail/LessonNavigation.tsx`                     | Modified | Accent next arrow                  |
| `.../proyectos/GuidedActivityDetails.tsx`                   | Modified | Pill removed, arrow restyled       |
| `src/components/agents/AgentChatWidget.tsx`                 | Modified | Reveal, expand, z-index, copy      |
| `src/app/api/agents/chat/route.ts`                          | Modified | Resolve user projects, owner check |
| `src/server/db/schema.ts`, `drizzle/`                       | Modified | `projects.type` + backfill         |
| `.../proyectos/ProjectsSocialView.tsx`                      | Modified | Wire `onCreateProject`             |
| `.../subcomponents/ProjectFeedCard.tsx`                     | Modified | Clamp + "ver más"                  |

## Risks

| Risk                                           | Likelihood | Mitigation                                                  |
| ---------------------------------------------- | ---------- | ----------------------------------------------------------- |
| `npm run db:migrate` hangs here                | High       | Apply via neon-http, register hash manually, user-approved  |
| Chat above header hides header dropdowns       | Med        | Only while expanded; restore z-index on collapse            |
| Chat route change breaks guided-project gating | Med        | Guided lookup runs first, premium check untouched           |
| Reveal feels slow or fights re-renders         | Med        | Tunable rate, skip on reduced motion, cancel on new message |
| Wizard assumes a course in later steps         | Med        | Verify all 8 steps with `courseId` undefined                |

## Operational Approval Gates

1. No `db:*` command runs without explicit user approval. The migration is applied
   through the repo's neon-http workaround with the hash registered manually.
2. Backfill sets `type` for every existing row before the column is relied on.
3. `npm run check` runs only at the authorized commit/push, not per edit.

## Delivery Slicing (auto-chain, 800-line budget)

| PR             | Content         | Migration |
| -------------- | --------------- | --------- |
| 1 — navigation | A1, A2          | No        |
| 2 — chat UX    | B3, B4+B5, B6   | No        |
| 3 — projects   | C7, C10, C8, C9 | **Yes**   |

PR 3 is the only slice needing a DB approval gate. If its forecast exceeds the
budget, split into 3a (C7 + C10, UI only) and 3b (C8 + C9, migration + chat API).

## Rollback Plan

Each slice is an independent revert. PRs 1–2 are pure code reverts. For PR 3, revert
the code first; the additive `type` column is harmless if left in place, and is
dropped only by a follow-up user-approved neon-http statement.

## Dependencies

- Existing `openAgentChatFor()` bus and `ModalResumen` wizard — reused as-is.
- Neon database access for the approved migration.

## Success Criteria

- [ ] No floating pill in either view; top-nav next works and reads as the primary action.
- [ ] Assistant answers reveal progressively; instant under reduced motion.
- [ ] Expanded chat covers the full window and renders above the header.
- [ ] All three quota tiers say "intentos" with correct Spanish agreement.
- [ ] `+ Nuevo proyecto` opens the same 8-step wizard with no course and saves.
- [ ] Saved user project opens a scoped chat that answers about that project.
- [ ] Feed descriptions clamp with a working "ver más".
- [ ] `npm run check` passes before the authorized push.

## Proposal question round (auto mode — review, do not block)

Assumptions taken: user projects are private to their owner; `type` values are
`course` | `user` with existing rows backfilled to `course`; the expand control is
additive and the pop-out control stays; "~3 paragraphs" means a line-clamp
approximation, not paragraph parsing. Correct any of these before sdd-spec.
