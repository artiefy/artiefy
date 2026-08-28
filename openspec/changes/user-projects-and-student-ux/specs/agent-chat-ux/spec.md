# Agent Chat UX Specification

## Purpose

Improve the multi-agent chat widget's perceived responsiveness and usability:
progressive reveal of already-received answers, a full-window expand mode
that is not hidden under the site header, and quota-notice copy that matches
what the counter actually counts (attempts, not messages).

## Requirements

### Requirement: Client-Side Progressive Reveal

The system MUST reveal a completed assistant response incrementally on the
client after the full response has been received (not literal network
streaming; no server/route change). Under `prefers-reduced-motion`, the
system MUST render the full response instantly with no incremental reveal.
Starting a new turn MUST cancel any in-progress reveal.

#### Scenario: Normal reveal

- GIVEN the full assistant response has been received
- WHEN it is displayed
- THEN the text appears progressively over a short, bounded duration
- AND it does not feel sluggish compared to instant display

#### Scenario: Reduced motion

- GIVEN `prefers-reduced-motion` is enabled
- WHEN a response is received
- THEN the full text renders immediately with no incremental animation

#### Scenario: Interrupted by new message

- GIVEN a reveal is in progress
- WHEN the user sends a new message before it finishes
- THEN the in-progress reveal stops immediately
- AND the new turn proceeds without visual overlap or corrupted text

### Requirement: Full-Window Expand Above Header

The system MUST add an expand control placed to the left of the existing
agent-switch icon in the chat header. Activating it MUST render the chat
panel full-window, stacked above the site header (including its dropdowns).
Collapsing MUST restore the chat's original size, position, and stacking
order exactly. This control is additive: the existing pop-out/Picture-in-
Picture control (`togglePopOut`) MUST remain unchanged and independently
available.

#### Scenario: Expand

- GIVEN the chat panel is open in its normal state
- WHEN the user activates the expand control
- THEN the chat fills the viewport
- AND it renders above the site header and its dropdowns

#### Scenario: Collapse restores stacking

- GIVEN the chat panel is expanded
- WHEN the user collapses it
- THEN the chat returns to its normal panel size and position
- AND the site header again renders above the chat, as before expansion

#### Scenario: Pop-out unaffected

- GIVEN the existing pop-out control
- WHEN the new expand control is added
- THEN pop-out continues to work exactly as before, unaffected by expand

### Requirement: Quota Notice Says "Intentos", Not "Mensajes"

`buildQuotaNotice()` MUST use "intentos" (or a grammatically-agreeing
derivative) instead of "mensajes" in all three tiers — anonymous, free
(signed-up, non-premium), and premium — while preserving correct Spanish
grammar for each tier's existing sentence structure.
(Previously: anon/free/premium notices referred to the quota as "mensajes".)

#### Scenario: Anonymous tier

- GIVEN an anonymous user has exhausted the free quota
- WHEN the notice renders
- THEN the text uses "intentos" (e.g. no "mensajes gratis"/"mensajes de cortesía")

#### Scenario: Free tier

- GIVEN a signed-up, non-premium user has exhausted the daily quota
- WHEN the notice renders
- THEN the text uses "intentos" and does not use "mensajes"

#### Scenario: Premium tier

- GIVEN a premium user has reached today's cap
- WHEN the notice renders
- THEN the text uses "intentos" and does not use "mensajes"
