# Design: guided-projects-section

## Technical Approach

Build a set of Server Actions to query the `guidedProjects`, `guidedObjectives`, `guidedObjectiveActivities`, and `userGuidedActivityProgress` tables using Drizzle ORM.
Create Zod-based TypeScript interfaces mapping to these Drizzle models, enriching them with calculated UI states (e.g., grouping by `weekNumber`).
On the frontend, introduce a new Next.js page at `src/app/estudiantes/proyectos-guiados/[id]/page.tsx` rendering a dedicated `GuidedProjectDetails` component that displays objectives chronologically and handles interaction through Server Actions.

## Architecture Decisions

### Decision: Dedicated Component for Guided Projects vs Reusing CourseDetails

**Choice**: Create a dedicated component (`GuidedProjectDetails`).
**Alternatives considered**: Add flags/parameters to the existing `CourseDetails` component.
**Rationale**: Guided projects have a strict week-based chronology, locked/unlocked objective states (`isEnabled`), and date-based activity availability (`startDate`, `endDate`, `weekNumber`). `CourseDetails` is optimized for asynchronous, module-based learning. Mixing them would bloat `CourseDetails` with excessive conditional logic, violating clean architecture.

### Decision: Server Actions for Data Fetching and Mutations

**Choice**: Implement specific Server Actions in `src/server/actions/estudiantes/guided-projects/index.ts`.
**Alternatives considered**: Standard REST API routes in `src/app/api/`.
**Rationale**: Follows Vercel React Best Practices for Next.js App Router, enabling seamless type-safety between server and client, reducing client-side Javascript, and enabling progressive enhancement.

### Decision: Data Aggregation Strategy

**Choice**: Perform data joining and structural grouping (e.g., nesting activities within objectives, calculating current week state) primarily on the Server Action before sending it to the client component.
**Alternatives considered**: Send flat lists from Drizzle and let the React component map and group them.
**Rationale**: By organizing data in the Server Action (using Drizzle's relational queries), we reduce serialization overhead and simplify the client component, strictly following `server-serialization` best practices.

## Data Flow

```text
[ Client: GuidedProjectDetails ]
      │             ▲
(user action)   (updated data)
      ▼             │
[ Server Action: toggleActivityProgress ] ──> Updates user_guided_activity_progress
      │
[ Server Action: getGuidedProjectById ] ────> Joins guidedProjects, guidedObjectives, guidedObjectiveActivities
                                        ────> Calculates current week and active states
```

## File Changes

| File                                                            | Action | Description                                                                                       |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| `src/server/actions/estudiantes/guided-projects/index.ts`       | Create | Server actions for fetching guided projects, objectives, and toggling progress.                   |
| `src/app/estudiantes/proyectos-guiados/[id]/page.tsx`           | Create | Next.js Server Component page that fetches initial data and renders the client component.         |
| `src/components/estudiantes/proyectos/GuidedProjectDetails.tsx` | Create | Client component displaying the weekly schedule, objectives, and progress controls.               |
| `src/components/estudiantes/proyectos/WeekSchedule.tsx`         | Create | Sub-component for rendering a specific week's activities, visually highlighting the current week. |

## Interfaces / Contracts

```typescript
import { z } from 'zod';
import { type InferSelectModel } from 'drizzle-orm';
import {
  guidedProjects,
  guidedObjectives,
  guidedObjectiveActivities,
  userGuidedActivityProgress,
} from '~/server/db/schema';

export type DbGuidedProject = InferSelectModel<typeof guidedProjects>;
export type DbGuidedObjective = InferSelectModel<typeof guidedObjectives>;
export type DbGuidedActivity = InferSelectModel<
  typeof guidedObjectiveActivities
>;
export type DbActivityProgress = InferSelectModel<
  typeof userGuidedActivityProgress
>;

// Enriched Types for UI
export interface ActivityWithProgress extends DbGuidedActivity {
  progressStatus: 'not-started' | 'in-progress' | 'completed';
  completedAt: Date | null;
  isAvailable: boolean; // Computed based on startDate, endDate, and objective isEnabled
}

export interface ObjectiveWithActivities extends DbGuidedObjective {
  activities: ActivityWithProgress[];
}

export interface GuidedProjectFull extends DbGuidedProject {
  isEnrolled: boolean;
  objectives: ObjectiveWithActivities[];
  weeks: Record<
    number,
    { weekNumber: number; activities: ActivityWithProgress[] }
  >;
}
```

## UI Logic

- **Current Week Calculation**: In the server action, `currentWeek` is determined by comparing `new Date()` against each activity's `startDate` and `endDate`.
- **Disabled Objectives**: If `objective.isEnabled` is `false`, its activities receive `isAvailable: false`. The `WeekSchedule` component applies a disabled visual style (e.g., opacity-50, pointer-events-none, lock icon) to these elements.
- **Future Activities**: If an activity's `startDate` is in the future, it is displayed as "Locked / Coming Soon".

## Testing Strategy

| Layer       | What to Test             | Approach                                                                                                                                            |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `getGuidedProjectById`   | Mock Drizzle `db.query` to return various dates and `isEnabled` flags. Assert the computed `isAvailable` and `weeks` aggregation is correct.        |
| Unit        | `toggleActivityProgress` | Assert proper upsert logic into `userGuidedActivityProgress`.                                                                                       |
| Integration | `GuidedProjectDetails`   | Render component with a mix of past, current, and future activities. Verify "Mark as Complete" button is only interactive for available activities. |

## Migration / Rollout

No migration required. Drizzle schema already includes necessary fields (`weekNumber`, `startDate`, `endDate`, `isEnabled`).

## Open Questions

- [ ] None.
