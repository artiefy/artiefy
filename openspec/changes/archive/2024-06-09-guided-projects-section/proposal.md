# SDD Proposal: Guided Projects Section

## 1. Intent

**Business Value:** This change introduces a new "Guided Projects" section for students. Unlike standard courses, these projects are structured around weekly objectives and time-bound activities, providing a more hands-on, scheduled learning experience. This will increase student engagement, provide a new premium content offering, and better structure long-term project-based learning.

## 2. Scope

### In Scope

- **New Frontend Route:** Create a new page at `src/app/estudiantes/proyectos-guiados/[id]/page.tsx` to display the details of a single guided project.
- **Backend Data Fetching:** Implement new Server Actions to fetch all necessary data for a guided project, including its objectives, activities, and the current user's enrollment status and progress.
- **UI Adaptation:** Adapt the existing `CourseDetails` UI to handle the new structure of Guided Projects. The key change will be to group objectives and activities by `week_number` and display their `start_date` and `end_date`.
- **Database Queries:** Use Drizzle ORM to query the newly created tables: `guidedProjects`, `guidedObjectives`, `guidedObjectiveActivities`, `guidedEnrollments`, and `userGuidedActivityProgress`.

### Out of Scope

- **Admin/Instructor UI:** This change does not include creating the user interface for administrators or instructors to create, edit, or manage guided projects.
- **Payment/Enrollment Logic:** The full enrollment flow and payment integration is not part of this scope. We will assume the user is already enrolled for display purposes.
- **Project Creation/Submission:** The UI for students to submit work for activities is not in this initial scope.

## 3. Technical Approach

### 3.1. Database Schema

The following Drizzle schemas, already present in `src/server/db/schema.ts`, will be used:

- `guidedProjects`: The main table for project details.
- `guidedObjectives`: Represents sessions or main goals within a project. Contains `is_enabled` flag.
- `guidedObjectiveActivities`: Represents the specific tasks for an objective. Contains `start_date`, `end_date`, and `week_number`.
- `guidedEnrollments`: Tracks student enrollment in projects.
- `userGuidedActivityProgress` and `userObjectiveProgress`: Track student progress through the project.

### 3.2. Backend (Server Actions)

A new file, `src/server/actions/guided-projects.ts`, will be created to house the data-fetching logic.

#### `getGuidedProjectById(id: number)`

This action will be the primary data source for the project page.

- **Functionality:**
  1.  Fetch the main project details from `guidedProjects`.
  2.  Fetch all associated `guidedObjectives` and their nested `guidedObjectiveActivities`.
  3.  For the current logged-in user, fetch their enrollment status from `guidedEnrollments`.
  4.  Fetch the user's progress for each objective (`userObjectiveProgress`) and activity (`userGuidedActivityProgress`).
- **Data Grouping:** The action will group the `guidedObjectiveActivities` by `week_number` to simplify rendering on the frontend.
- **Return Type (Illustrative):**

  ```typescript
  interface GuidedProjectData {
    id: number;
    title: string;
    description: string;
    // ... other project fields
    isEnrolled: boolean;
    weeks: {
      [week: number]: {
        week_number: number;
        activities: ActivityWithProgress[];
      };
    };
    objectives: ObjectiveWithProgress[];
  }

  interface ObjectiveWithProgress extends GuidedObjective {
    progress?: UserObjectiveProgress;
    activities: ActivityWithProgress[];
  }

  interface ActivityWithProgress extends GuidedObjectiveActivity {
    progress?: UserGuidedActivityProgress;
  }
  ```

### 3.3. Frontend

#### New Route: `src/app/estudiantes/proyectos-guiados/[id]/page.tsx`

- This will be a Server Component that calls `getGuidedProjectById` to fetch all data.
- It will reuse components from the existing `/cursos/[id]` page where applicable (e.g., header, title section).

#### Component Adaptation: `ProjectDetailsView`

- A new component, `ProjectDetailsView`, will be created, likely adapted from `CourseDetails`.
- Instead of a simple list of lessons, it will render content grouped by weeks.
- It will map over the `weeks` object returned by the server action.
- For each week, it will display the list of `guidedObjectiveActivities`, showing their name, dates (`start_date`, `end_date`), and the user's progress.
- The `guidedObjectives` will be displayed in a separate tab or section, similar to how course modules are displayed, respecting the `is_enabled` flag to conditionally show or lock content.

## 4. Risks

- **UI Complexity:** The weekly, date-based view is more complex than the linear course view. Careful state management and component design will be needed to present this information clearly.
- **Query Performance:** The main `getGuidedProjectById` action will involve multiple database joins. The query must be optimized to prevent slow page loads. Using Drizzle's relational queries (`relations`) will be essential.

## 5. Success Criteria

- A student can navigate to ` /estudiantes/proyectos-guiados/[id]`.
- The page loads and displays the guided project's title, description, and weekly schedule of activities.
- Objectives are displayed, and their `isEnabled` status is reflected in the UI (e.g., locked/unlocked appearance).
- The user's progress for each activity and objective is correctly shown.
