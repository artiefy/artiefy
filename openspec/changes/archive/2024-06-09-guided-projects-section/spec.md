# Guided Projects Specification

## 1. Purpose

This document outlines the technical specifications for the "Guided Projects" feature. It defines the data structures, business rules, and user interaction scenarios required to display and manage user progress through a guided project, which is a time-based learning experience structured into weekly objectives and activities.

## 2. Data Models (Zod Schemas)

To ensure data consistency between the backend and frontend, the following Zod schemas define the core data entities.

```typescript
import { z } from 'zod';

// Progress for a single activity
const UserActivityProgressSchema = z.object({
  id: z.number(),
  userId: z.string(),
  activityId: z.number(),
  status: z.enum(['not-started', 'in-progress', 'completed']),
  completedAt: z.date().nullable(),
});

// A single activity within an objective
const ActivitySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  week_number: z.number(),
  start_date: z.date(),
  end_date: z.date(),
  progress: UserActivityProgressSchema.optional(),
});

// An objective containing multiple activities
const ObjectiveSchema = z.object({
  id: z.number(),
  title: z.string(),
  is_enabled: z.boolean(),
  activities: z.array(ActivitySchema),
});

// The main guided project structure
const GuidedProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  isEnrolled: z.boolean(),
  objectives: z.array(ObjectiveSchema),
  // The 'weeks' structure is derived in the backend for UI convenience
  weeks: z.record(
    z.string(),
    z.object({
      week_number: z.number(),
      activities: z.array(ActivitySchema),
    })
  ),
});
```

## 3. Requirements

### Requirement: REQ-PROJECT-VIEW - Display Full Project Details

The system **MUST** fetch and display the complete structure of a guided project for an enrolled user, including all objectives, activities, and the user's current progress.

#### Scenario: A user views the project detail page

- **GIVEN** a user is logged in and enrolled in a guided project
- **WHEN** the user navigates to the project's detail page (`/estudiantes/proyectos-guiados/[id]`)
- **THEN** the system **MUST** display the project title and description
- **AND** the system **MUST** display all objectives associated with the project
- **AND** the system **MUST** display all activities, grouped by their `week_number`
- **AND** the user's completion status for each activity **MUST** be visible.

### Requirement: REQ-OBJECTIVE-ACCESS - Control Objective Availability

The system **MUST** restrict access to an objective and its associated activities based on its `is_enabled` flag.

#### Scenario: A user encounters a disabled objective

- **GIVEN** a user is viewing a guided project
- **AND** one of the objectives has `is_enabled` set to `false`
- **WHEN** the user views the list of objectives
- **THEN** the disabled objective and all its activities **MUST** be displayed in a "locked" or "unavailable" state
- **AND** the user **MUST NOT** be able to interact with or complete any activities within that objective.

### Requirement: REQ-ACTIVITY-ACCESS - Control Activity Availability by Date

The system **MUST** manage the availability of activities based on the current date relative to the activity's `start_date` and `end_date`. The UI **SHOULD** highlight the current week's activities.

#### Scenario: A user sees an activity that has not started yet

- **GIVEN** a user is viewing a guided project
- **AND** an activity has a `start_date` in the future
- **WHEN** the user views the activities for that week
- **THEN** the activity **MUST** be visible but displayed in a "locked" or "coming soon" state
- **AND** the user **MUST NOT** be able to mark the activity as complete.

#### Scenario: A user sees activities for the current week

- **GIVEN** a user is viewing a guided project
- **AND** the current date is between the `start_date` and `end_date` of one or more activities
- **WHEN** the user views the project's weekly schedule
- **THEN** the section for the current `week_number` **SHOULD** be visually highlighted
- **AND** the activities for the current week **MUST** be interactive (unless their parent objective is disabled).

### Requirement: REQ-PROGRESS-TRACKING - Track Activity Completion

The system **MUST** allow a user to mark an activity as complete and persist this state in the `user_guided_activity_progress` table.

#### Scenario: A user completes an activity

- **GIVEN** a user is viewing an available and unlocked activity
- **WHEN** the user clicks the "Mark as Complete" button for that activity
- **THEN** the system **MUST** update the corresponding record in the `user_guided_activity_progress` table to have a status of `completed`
- **AND** the UI **MUST** immediately reflect the new "completed" state for that activity.

## 4. Definition of Done

The "Guided Projects" feature spec is considered "Done" when:

1.  All requirements listed above are fully defined with clear acceptance criteria.
2.  All user scenarios (happy path and edge cases) for viewing content and tracking progress are documented.
3.  The Zod data models for all relevant entities are defined and cover the fields necessary to meet the requirements.
4.  The spec is approved and ready to be used as the source of truth for the `sdd-design` and `sdd-tasks` phases.
