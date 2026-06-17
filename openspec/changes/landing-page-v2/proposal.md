# SDD Change Proposal: Landing Page v2

- **Change:** `landing-page-v2`
- **Status:** `proposed`
- **Project:** `artiefy`

## 1. Intent & Business Value

**Intent:** To design and implement a new, conversion-focused primary landing page for the Artiefy platform. The current page is functional but lacks the persuasive structure and polished design needed to effectively convert visitors into Premium/Pro subscribers.

**Business Value:**

- **Increased Conversion Rate:** A more compelling and user-centric design will guide visitors towards our subscription plans, directly impacting revenue.
- **Improved Brand Perception:** A modern, elegant "shop window" enhances brand credibility and positions Artiefy as a top-tier educational platform.
- **Enhanced User Experience:** By integrating a prominent course search feature directly into the hero section, we reduce friction and help users immediately find relevant content, increasing engagement.

## 2. Scope

### In Scope

- **New Page Creation:** Implementation will occur on a new, separate route: `/v2`. The existing landing page at `/` will NOT be modified.
- **New Component `src/app/v2/page.tsx`:** This will be the main entry point for the new design.
- **Persuasive Structure & Copy:** The page will be structured with clear, compelling sections designed to generate curiosity and drive action. This includes:
  - **Hero Section:** With a captivating headline and an integrated course/program search bar.
  - **"Why Artiefy?" Section:** Highlighting key benefits and differentiators.
  - **Social Proof/Testimonials:** To build trust.
  - **Clear Call-to-Action (CTA):** Guiding users to view plans or sign up.
- **Visual Design:** The design will be elegant, modern, and visually engaging, aligning with the `frontend-design` skill principles.
- **Responsiveness:** The page will be fully responsive across desktop, tablet, and mobile devices.

### Out of Scope

- **Changes to `/`:** No modifications will be made to the current live landing page (`src/app/page.tsx`).
- **Authentication/Dashboard:** This change does not affect the user authentication flow or any part of the student/instructor dashboards.
- **Backend Search Logic:** This proposal covers the UI/UX of the search bar. The actual backend search endpoint implementation will be handled as a separate task if not already available.
- **A/B Testing Framework:** Integration with an A/B testing tool is not part of this initial implementation.

## 3. Technical Approach

The implementation will follow modern Next.js App Router patterns and leverage the existing component library to ensure consistency and development speed.

1.  **Route Setup:**
    - A new page will be created at `src/app/v2/page.tsx`. This isolates the new development effort, allowing for safe, iterative deployment on `main` without affecting production traffic.

2.  **Component Reuse & Composition:**
    - We will heavily utilize the existing `shadcn/ui` components found in `src/components/estudiantes/ui/`.
    - **Core UI:** `Button` (`button.tsx`), `Card` (`card.tsx`), `Input` (`input.tsx`), and `Badge` (`badge.tsx`) will be used for building the primary UI elements.
    - **Hero Section:** We will investigate using the existing `HeroCanvas.tsx` component from `src/components/estudiantes/layout/` to create a visually striking and dynamic background for the hero.
    - **Search Bar:** The search functionality will be built by composing the `Input` and `Button` components, creating a dedicated `CourseSearch.tsx` client component to handle user input and interaction with the search API.
    - **Layout:** Standard layout components like `Header.tsx` and `Footer.tsx` will be reused to maintain site-wide consistency.

3.  **Page Structure (High-Level):**

    ```
    - /v2
      - Header (reused)
      - HeroSection (with integrated CourseSearch)
      - FeaturesSection (using Cards)
      - TestimonialsSection (using Carousel if applicable)
      - CTABanner
      - Footer (reused)
    ```

4.  **Styling:**
    - Styling will be managed via Tailwind CSS, consistent with the rest of the project.
    - The design will adhere to the principles of high-quality frontend design, focusing on spacing, typography, and visual hierarchy to create a polished and professional aesthetic.

## 4. Risks & Mitigation

- **Risk:** Minimal. The primary risk of impacting the live site is mitigated by developing on the `/v2` route.
- **Mitigation:** Development is entirely isolated. The new page will only be made live by a deliberate future change to the root routing configuration.

## 5. Next Steps

- **Approval:** Await approval of this proposal.
- **Next Phase:** `sdd-spec`. Proceed with creating detailed specifications and user stories for each section of the new landing page.
