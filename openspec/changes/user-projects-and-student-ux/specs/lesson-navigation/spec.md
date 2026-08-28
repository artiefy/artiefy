# Lesson Navigation Specification

## Purpose

Single, unambiguous way to advance between lessons and guided-project
activities: the top-nav next/prev control is the only navigation affordance.
The overlapping floating "next" pills in both the course lesson view and the
guided-project activity view are removed.

## Requirements

### Requirement: Remove Floating Next Pill — Course Lesson View

The system MUST NOT render the floating fixed-position "next lesson" pill
(previously `NextLessonModal.tsx`, rendered from `LessonDetails.tsx`) in the
course lesson view. The top-nav next control (`LessonNavigation.tsx`) MUST
remain the sole next-lesson affordance and MUST keep working.

#### Scenario: Pill absent, top-nav still works

- GIVEN a student viewing a lesson with a next lesson available
- WHEN the lesson view renders
- THEN no fixed-position floating "next" element is present
- AND the top-nav next control still navigates to the next lesson

#### Scenario: Last lesson in course

- GIVEN the student is on the course's last lesson
- WHEN the view renders
- THEN no floating pill appears
- AND the top-nav reflects an end/disabled state, unchanged from prior top-nav behavior

### Requirement: Remove Floating Next Pill — Guided Activity View

The system MUST NOT render the floating "Siguiente" block (previously inline
in `GuidedActivityDetails.tsx`) in the guided-project activity view. The
inline top-nav prev/next controls in that same file MUST remain the sole
navigation affordance and MUST keep working.

#### Scenario: Pill absent, top-nav still works

- GIVEN a student viewing a guided-project activity with a next activity available
- WHEN the view renders
- THEN no fixed-position floating "Siguiente" element is present
- AND the top-nav next control still navigates to the next activity

#### Scenario: Last activity in guided project

- GIVEN the student is on the guided project's last activity
- WHEN the view renders
- THEN no floating pill appears
- AND the top-nav reflects an end/disabled state, unchanged from prior top-nav behavior

### Requirement: Prominent Top-Nav Next Control — Lesson View

The top-nav next control in `LessonNavigation.tsx` MUST use a visually
prominent, accent-colored style so it reads as the primary action, replacing
its current low-contrast styling. Existing click/keyboard behavior and
disabled states MUST be preserved.

#### Scenario: Next available

- GIVEN a lesson with a next lesson available
- WHEN `LessonNavigation` renders
- THEN the next control uses an accent style distinguishable from surrounding chrome
- AND clicking it navigates exactly as before

#### Scenario: Next unavailable

- GIVEN no next lesson exists
- WHEN `LessonNavigation` renders
- THEN the control shows a clear disabled state, not the accent style

### Requirement: Prominent Top-Nav Next Control — Guided Activity View

The top-nav next control in `GuidedActivityDetails.tsx` (lines 535-548) MUST
use the same visually prominent, accent-colored style, replacing its current
unstyled `ghost` variant. Existing click/keyboard behavior and disabled
states MUST be preserved.

#### Scenario: Next available

- GIVEN an activity with a next activity available
- WHEN the top-nav renders
- THEN the next control uses an accent style distinguishable from surrounding chrome
- AND clicking it navigates exactly as before

#### Scenario: Next unavailable

- GIVEN no next activity exists
- WHEN the top-nav renders
- THEN the control shows a clear disabled state, not the accent style
