# Spec: landing-page-v2

**Change:** `landing-page-v2`
**Project:** `artiefy`
**Author:** sdd-spec-agent
**Source Proposal:** `engram://artiefy/sdd/landing-page-v2/proposal` / `openspec/changes/landing-page-v2/proposal.md`

---

## 1. Overview

This specification details the functional and non-functional requirements for the new `landing-page-v2`. This is a **NEW** capability, so this document describes the complete behavior of the page, not a delta.

## 2. Requirements

### 2.1. Functional Requirements

| ID   | Requirement                          | Description                                                                                                                                                                                                       |
| :--- | :----------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-1 | **Central Course Search Bar**        | The hero section **MUST** feature a prominent search bar. Users **MUST** be able to type a query and initiate a search for courses and programs. The input **SHOULD** be validated (e.g., against empty strings). |
| FR-2 | **Persuasive Landing Page Sections** | The page **MUST** contain dedicated sections for: Hero (with headline/search), "Why Artiefy?" (benefits), Social Proof (testimonials), and a final Call-to-Action (CTA) to encourage sign-ups.                    |
| FR-3 | **Standard Site Navigation**         | The page **MUST** reuse the existing site-wide `Header` and `Footer` components to ensure consistent navigation and branding with the rest of the application.                                                    |

### 2.2. Non-Functional Requirements

| ID    | Requirement                       | Acceptance Criteria                                                                                                                                                                                         |
| :---- | :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | **Visual Elegance & Polish**      | The UI **MUST** adhere to high-quality design principles (spacing, typography, visual hierarchy). The final result **SHOULD** feel modern, trustworthy, and professional, avoiding generic "AI" aesthetics. |
| NFR-2 | **Performance (Core Web Vitals)** | The page **MUST** aim for a "Good" score on Core Web Vitals. Largest Contentful Paint (LCP) **SHOULD** be under 2.5s. The page **MUST NOT** have a blocking First Input Delay (FID).                        |
| NFR-3 | **SEO Friendliness**              | The page **MUST** include appropriate meta tags (`title`, `description`), a single `<h1>` tag in the hero, and semantic HTML structure (e.g., `<section>`, `<header>`) to facilitate indexing.              |
| NFR-4 | **Accessibility**                 | The page **MUST** meet WCAG 2.1 Level AA guidelines. All interactive elements (search bar, buttons) **MUST** be keyboard-navigable and have appropriate ARIA labels.                                        |

## 3. Scenarios

### 3.1. Search Bar Interaction

**Scenario: User performs a successful search**

- **GIVEN** a visitor is on the `/v2` landing page
- **WHEN** they type "Next.js" into the course search bar
- **AND** they click the "Search" button
- **THEN** they **MUST** be redirected to the main course catalog page (`/cursos`) with the search results pre-filtered for the term "Next.js".

**Scenario: User attempts an empty search**

- **GIVEN** a visitor is on the `/v2` landing page
- **WHEN** they click the "Search" button without typing anything in the search bar
- **THEN** the search **MUST NOT** be initiated.
- **AND** a subtle visual indicator (e.g., a red border on the input) **SHOULD** appear, hinting that input is required.

### 3.2. Conversion Flow

**Scenario: User navigates to view subscription plans**

- **GIVEN** a visitor has scrolled through the sections on the `/v2` landing page
- **WHEN** they click the primary Call-to-Action button (e.g., "View Plans" or "Upgrade to Pro")
- **THEN** they **MUST** be navigated to the pricing or subscription page.

## 4. Out of Scope

- **Backend Search Logic:** Implementation of the API endpoint that returns search results is not included. This spec assumes a functional endpoint exists.
- **A/B Testing:** No A/B testing framework will be integrated.
- **Authentication:** The page is for anonymous visitors; it does not handle user login or session state.

## 5. Definition of "Done"

- [ ] All functional requirements (FR-1 to FR-3) are implemented.
- [ ] All non-functional requirements (NFR-1 to NFR-4) are met and verified (e.g., via Lighthouse/PageSpeed Insights and accessibility audits).
- [ ] All user scenarios in Section 3 pass manual and/or automated testing.
- [ ] The new page is deployed and accessible at the `/v2` route.
- [ ] The implementation is fully responsive on desktop, tablet, and mobile viewports.
- [ ] Code is reviewed and merged to the `main` branch.
