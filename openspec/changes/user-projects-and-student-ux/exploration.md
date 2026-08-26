# Exploration — user-projects-and-student-ux

Status: complete
Phase: sdd-explore
Backend mirror: Engram topic `sdd/user-projects-and-student-ux/explore` (observation 879)

## Scope

A batch of 9 change requests captured from a live review of the student-facing app,
spanning three areas: lesson/activity navigation, the multi-agent AI chat, and projects.

## Group A — lesson & guided-project activity navigation

### A1. Remove the floating "next" pill

The floating pill is **two independent implementations**, not one shared component:

| View                    | Location                                                                 | Notes                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Course lesson           | `src/components/estudiantes/layout/lessondetail/NextLessonModal.tsx`     | The entire file is the pill (`fixed right-6 bottom-6 z-50`). Rendered only from `src/app/estudiantes/clases/[id]/LessonDetails.tsx:1104-1123`. |
| Guided-project activity | `src/components/estudiantes/proyectos/GuidedActivityDetails.tsx:897-914` | Inline JSX (`fixed right-6 bottom-6 z-30`), no separate component.                                                                             |

Navigation that must survive:

- Course: `src/components/estudiantes/layout/lessondetail/LessonNavigation.tsx`
- Guided project: inline prev/next `Button` block at `GuidedActivityDetails.tsx:508-561`

### A2. More prominent "next" arrow

Two separate restyles, no shared component:

- `LessonNavigation.tsx` — plain SVG chevrons, currently `text-slate-200`
- `GuidedActivityDetails.tsx:535-548` — ghost `Button` + lucide `ChevronRight`, no color

## Group B — multi-agent AI chat

Core files: `src/components/agents/AgentChatWidget.tsx`,
`src/app/api/agents/chat/route.ts`, `src/lib/agents/agentChatBus.ts`,
`src/server/agents/agentChatQuota.ts`.

### B3. Stream the assistant response

Not implemented anywhere today. The server does `await response.json()` against the
n8n webhook (single blocking call); the client also does `await response.json()` and
appends the complete message at once.

Two viable strategies:

- **True streaming** — requires n8n webhook streaming support end to end (unverified).
- **Client-side typewriter reveal** over the already-complete text — no backend change,
  cheaper, but not literally network streaming.

### B4. The "expand" icon — AMBIGUOUS

No literal "expand" icon exists. The only candidate is the
`PictureInPicture` / `PictureInPicture2` pop-out/detach control (`togglePopOut`,
`AgentChatWidget.tsx` ~1726-1749). The source request reads `dejar el ico de expandir`,
ambiguous between keep and remove.

### B5. Expanded panel must render above the header

Confirmed stacking gap:

- `Header.tsx` — `z-[99990]` / `z-[100000]` / `z-[99999]`
- Chat panel — `z-60` / `z-[72]` / `z-[75]` / `z-[79]`

### B6. "mensajes" -> "intentos"

All three tiers' copy lives in one function: `buildQuotaNotice()` in
`AgentChatWidget.tsx:393-418`. The exact quoted strings
("Se te acabaron los mensajes gratis" / "Ya usaste los 5 mensajes de cortesia")
match only the **anon** tier (`AGENT_QUOTA_LIMITS.anon = 5`, confirmed in
`agentChatQuota.ts`). The `free` and `premium` tiers use different wording that also
says "mensajes".

## Group C — projects

### C7. Clamp the feed description

`src/components/projects/ProjectFeedCard.tsx:647-649` renders the description with no
clamp and no expander (`whitespace-pre-wrap`, full text). A different card,
`ProjectsSection.tsx:641`, already uses `line-clamp-2`.

### C8. User-owned ("proyecto de usuario") projects

Current creation flow, mapped end to end:

```
ModalResumen.tsx (8 steps, step 1 = "Informacion Basica")
  -> useGenerateContent() -> POST /api/projects/generate-content
  -> POST /api/projects?draft=true
  -> src/server/actions/project/createProject.ts
  -> projects table (src/server/db/schema.ts:419-460)
```

**Key finding: no schema migration is required to allow a courseless project.**
`courseId` is already optional end to end — the column is nullable
(`.default(sql\`NULL\`)`, no `.notNull()`), and the action and route already handle
`?? undefined`/`?? null`.

**UI wiring gap.** `src/components/estudiantes/proyectos/ProjectsSocialView.tsx`
already imports `ModalResumen` (used today only for editing, with
`courseId={editingProject?.courseId ?? undefined}`) and renders `ProjectsLeftRail`
— including its `+ Nuevo proyecto` button — **without** passing `onCreateProject`.
The button is currently wired to nothing.

**Correction to the original request.** `src/components/super-admin/CourseContent.ts`
is empty (0 bytes) and is not the modal host. The real host is
`src/components/estudiantes/layout/coursedetail/ProjectsSection.tsx`.

Remaining design decision: explicit `kind` / `type` discriminator column versus relying
on `courseId IS NULL`.

### C9. Open a project-scoped chat after creation

`openAgentChatFor()` in `src/lib/agents/agentChatBus.ts` is a reusable DOM-event bus,
already used the same way after course enrollment (`CourseDetails.tsx`) and guided-project
enrollment (`GuidedProjectDetails.tsx`).

**Real coupling risk.** The project-context branch in `src/app/api/agents/chat/route.ts`
is hard-coded to `getGuidedProjectById()`, which queries the separate `guidedProjects`
table (curated admin content) — not the general `projects` table that `ModalResumen`
writes to. Passing a user-project id today returns 403 "Este proyecto guiado es Premium".
This needs backend design, not just a UI call.

## Open questions

1. **B4** — keep or remove the pop-out / PictureInPicture control?
2. **B6** — scope the "mensajes" -> "intentos" swap to the anon tier only, or all three?
3. **C8** — implicit discriminator (`courseId IS NULL`) or an explicit `kind` column?
4. **C9** — a new dedicated scope kind for user-owned projects in the chat API, or extend
   the existing project-context branch to look in both tables?

## Risks

1. C9 requires new backend logic to scope the chat to user-owned `projects` rows;
   impossible today without changing `route.ts`.
2. B3 true streaming depends on unverified n8n webhook streaming support.
3. B4 and B6 need explicit user answers before implementation.
4. `npm run db:migrate` hangs in this environment (existing repo convention); any schema
   change must use the documented neon-http workaround with the hash registered manually.

## Effort reality check

Items A1, A2, C7, and the anon-scoped reading of B6 are low-risk UI-only edits.
B5 is a one-line z-index fix once a target value is agreed.
C8 is substantially smaller than originally assumed — schema, action, and route already
support a courseless project; the dead button needs wiring plus the discriminator decision.
B3 and C9 carry the real backend design work.
