# Tasks: Guided Projects Section

## Review Workload Forecast

| Field                   | Value     |
| ----------------------- | --------- |
| Estimated changed lines | 300-450   |
| 400-line budget risk    | Medium    |
| Chained PRs recommended | No        |
| Suggested split         | Single PR |
| Delivery strategy       | automatic |
| Chain strategy          | pending   |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                         | Likely PR | Notes                                                              |
| ---- | -------------------------------------------- | --------- | ------------------------------------------------------------------ |
| 1    | Infrastructure, core logic and UI components | PR 1      | Base implementation including Server Actions and main UI elements. |

## Phase 1: Foundation (Server Actions & Types)

- [x] 1.1 Create `src/server/actions/estudiantes/guided-projects/index.ts` and define TypeScript interfaces (`ActivityWithProgress`, `ObjectiveWithActivities`, `GuidedProjectFull`).
- [x] 1.2 Implement `getGuidedProjectById` action using Drizzle relational queries.
- [x] 1.3 Implement grouping logic in `getGuidedProjectById` to organize activities by `week_number` and compute `isAvailable`.
- [x] 1.4 Implement `toggleActivityProgress` action to handle activity completion updates (upsert into `userGuidedActivityProgress`).

## Phase 2: Core Implementation (UI Components)

- [x] 2.1 Create `src/components/estudiantes/proyectos/WeekSchedule.tsx` to render activities with highlighting for current week.
- [x] 2.2 Create `src/components/estudiantes/proyectos/GuidedProjectDetails.tsx` to display project info and the weekly schedule.
- [x] 2.3 Implement locking/disabled logic in `WeekSchedule` using `isAvailable` and `isEnabled` flags.

## Phase 3: Integration & Routing

- [x] 3.1 Create Server Component page at `src/app/estudiantes/proyectos-guiados/[id]/page.tsx`.
- [x] 3.2 Fetch project data on the page using `getGuidedProjectById`.
- [x] 3.3 Connect `GuidedProjectDetails` to the page and wire the "Mark as Complete" interaction to `toggleActivityProgress`.

## Phase 4: Verification

- [x] 4.1 Verify activities outside the date range or in disabled objectives are visually and functionally locked.
- [x] 4.2 Verify clicking "Mark as Complete" correctly updates and persists progress in the database.
- [x] 4.3 Verify visual highlighting of the current week section based on today's date.
