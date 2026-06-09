# Design: landing-page-v2

## Technical Approach

The implementation will introduce a new Next.js route at `/v2` using the App Router. We will build a highly polished, conversion-focused landing page by composing Server Components for static, SEO-friendly sections (Hero, Features, Testimonials, CTA) and a single Client Component (`CourseSearch`) to handle search interactions. We will leverage existing `shadcn/ui` components (`Button`, `Input`, `Card`) and the `HeroCanvas` background, adhering to the Vercel React Best Practices for optimal Core Web Vitals and a minimal JavaScript bundle.

## Architecture Decisions

### Decision: Component Rendering Strategy

**Choice**: Use React Server Components (RSC) for all layout and content sections, isolating the search interaction into a small Client Component (`CourseSearch`).
**Alternatives considered**: Making the entire Hero or Page a Client Component to handle search state and animations.
**Rationale**: Adhering to the `server-serialization` and `bundle-analyzable-paths` rules from Vercel's React best practices. This keeps the bundle size minimal, improves LCP, and ensures the page is highly SEO-friendly.

### Decision: Search Interaction Routing

**Choice**: Client-side redirect via `next/navigation` `useRouter` on form submission.
**Alternatives considered**: Fetching results directly on the landing page or using a server action to redirect.
**Rationale**: Redirecting to the existing `/cursos` page with a query parameter (`?q=term`) reuses the existing, robust search and filter infrastructure, maintaining a single source of truth for course discovery while providing immediate feedback to the user on the landing page.

### Decision: Visual Aesthetic & Theming

**Choice**: "Refined Elegance" – Deep, dark backgrounds with vibrant, glowing accents (mesh gradients) and crisp typography.
**Alternatives considered**: A generic, flat, white/blue SaaS look.
**Rationale**: To meet NFR-1 (Visual Elegance & Polish) and align with `frontend-design` principles, we want an unforgettable first impression. Using sophisticated micro-interactions (soft shadows, hover lifts) and a distinct display font creates trust and differentiates Artiefy as a premium educational platform.

## Data Flow

    [User on /v2]
         │
         ├── Types query in <CourseSearch /> (Client State)
         │
         └── Clicks "Search" ──(Validates input)──┐
                                                  │
    [Redirect: router.push('/cursos?q=query')] ───┘
         │
    [User lands on /cursos with pre-filtered results]

## File Changes

| File                                                | Action | Description                                                        |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `src/app/v2/page.tsx`                               | Create | Server component stitching all sections, Header, and Footer.       |
| `src/components/landing-v2/HeroSection.tsx`         | Create | RSC for the hero, rendering `HeroCanvas` and `CourseSearch`.       |
| `src/components/landing-v2/CourseSearch.tsx`        | Create | Client Component with input state, validation, and redirect logic. |
| `src/components/landing-v2/FeaturesSection.tsx`     | Create | RSC displaying "Why Artiefy?" using `shadcn/ui` Cards.             |
| `src/components/landing-v2/TestimonialsSection.tsx` | Create | RSC for social proof and user feedback.                            |
| `src/components/landing-v2/CtaSection.tsx`          | Create | RSC with the final conversion banner leading to Pricing.           |

## Interfaces / Contracts

No new backend API contracts. The `CourseSearch` component interacts with the frontend routing API.

```typescript
// src/components/landing-v2/CourseSearch.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseSearch() {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError(true);
      return;
    }
    router.push(`/cursos?q=${encodeURIComponent(query.trim())}`);
  };
  // ... renders form, Input, and Button
}
```

## Testing Strategy

| Layer       | What to Test              | Approach                                                                                                                 |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Unit        | `CourseSearch` validation | Render component, simulate empty submit -> verify error state. Simulate valid submit -> verify `router.push` called.     |
| Integration | `/v2` layout              | Verify page renders Hero, Features, Testimonials, and Cta sections correctly without crashing.                           |
| E2E         | Search Flow & Links       | Playwright: Navigate to `/v2`, submit search, verify redirect to `/cursos?q=...`. Click CTA, verify redirect to pricing. |

## Migration / Rollout

No migration required. The page will live on `/v2` and can be tested iteratively in production before updating the root routing configuration.

## Open Questions

- [ ] Are we integrating specific placeholder images for the Features/Testimonials, or should we use generic abstract shapes/icons?
- [ ] What is the exact URL for the "Pricing/Plans" page that the final CTA should link to?
