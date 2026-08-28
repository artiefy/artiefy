# User Projects Specification

## Purpose

Let a student own a project outside any course — created from `/proyectos`
via the existing wizard — with the same public/draft visibility rule already
used for course-linked projects, a `type` discriminator distinguishing
course vs. user projects, and an owner-scoped coach chat.

## Requirements

### Requirement: Visibility Mirrors Existing Publication Rule

A user-owned project (`courseId = NULL`) MUST follow the exact same
`isPublic` visibility rule already applied to course-linked projects:
visible in the `/proyectos` public feed only when `isPublic = true`; always
visible to its owner regardless of `isPublic`. The system MUST NOT introduce
a separate private-by-default rule for user projects.

#### Scenario: Public user project appears in feed

- GIVEN a user project with `isPublic = true`
- WHEN the public feed is queried
- THEN it appears using the same filter/order as a course project with `isPublic = true`

#### Scenario: Draft user project stays hidden

- GIVEN a user project with `isPublic = false`
- WHEN another student queries the public feed
- THEN it does not appear, consistent with a draft course project

### Requirement: Explicit `type` Discriminator

The `projects` table MUST gain an explicit `type` column with allowed values
`course` and `user`. Every pre-existing row MUST be backfilled to `course`.
Projects created without a `courseId` (via the courseless wizard path) MUST
persist with `type = 'user'`; projects created with a `courseId` MUST persist
with `type = 'course'`.

#### Scenario: Backfill existing rows

- GIVEN all pre-migration rows have a non-null `courseId`
- WHEN the migration runs
- THEN every existing row's `type` is `course`

#### Scenario: New user project gets `user` type

- GIVEN a project is created via the wizard with no `courseId`
- WHEN it is persisted
- THEN `type = 'user'` and `courseId` is null

### Requirement: Wire "+ Nuevo Proyecto" on `/proyectos`

`ProjectsSocialView` MUST wire `onCreateProject` on `ProjectsLeftRail` to open
the existing 8-step `ModalResumen` wizard with `courseId={undefined}`. The
wizard MUST complete all 8 steps and save successfully with no course
context.

#### Scenario: Create with no course

- GIVEN a student on `/proyectos` clicks "+ Nuevo proyecto"
- WHEN the modal opens
- THEN it is the same 8-step wizard starting at "Información Básica 1/8" with no course preselected
- AND saving creates a project with `courseId = null`, `type = 'user'`

#### Scenario: Cancel without saving

- GIVEN the modal is open
- WHEN the student closes it without completing the save
- THEN no project row is created
- AND the "+ Nuevo proyecto" button remains usable for a new attempt

### Requirement: Owner-Scoped Project Coach Chat

After a user project is saved, the system MUST call `openAgentChatFor()` to
open a coach chat scoped to that project. `/api/agents/chat` MUST resolve
project context by checking `guidedProjects` first (existing premium gate
unchanged), then falling back to the `projects` table for user projects.
Only the project's owner (`projects.userId` equals the requesting session's
user) MAY use the coach chat for that project; any other user requesting
that project scope MUST be rejected.

#### Scenario: Owner opens chat after save

- GIVEN a student saves a new user project
- WHEN the save succeeds
- THEN a coach chat opens scoped to that project and answers using its data

#### Scenario: Guided-project gating unaffected

- GIVEN a chat request scoped to an existing guided project
- WHEN the route resolves project context
- THEN it resolves via `guidedProjects` exactly as before, premium gate unchanged

#### Scenario: Non-owner rejected

- GIVEN a user project owned by student A
- WHEN student B's session requests chat scoped to that project id
- THEN the request is rejected, consistent with existing entitlement-rejection behavior

### Requirement: Feed Description Clamp with "Ver Más"

`ProjectFeedCard` MUST clamp a paragraph-structured description to its first
3 paragraphs, with a "ver más" control that reveals the remaining paragraphs
in place. When the description has no discernible paragraph structure, a
line-clamp approximation MAY be used as a documented fallback and MUST still
offer "ver más" when the text overflows.

#### Scenario: Long paragraph-structured description

- GIVEN a description with 5 paragraphs
- WHEN the card renders
- THEN only the first 3 paragraphs are visible plus "ver más"
- AND clicking "ver más" reveals paragraphs 4-5 in place

#### Scenario: Short description

- GIVEN a description with 3 paragraphs or fewer
- WHEN the card renders
- THEN the full text shows with no "ver más" control

#### Scenario: Unstructured text fallback

- GIVEN a description with no paragraph breaks
- WHEN the card renders
- THEN the documented line-clamp fallback applies
- AND "ver más" is available if the clamped content overflows
