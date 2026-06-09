# Tasks: landing-page-v2

## Review Workload Forecast

| Field                   | Value                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Estimated changed lines | 600 - 750                                                                                  |
| 400-line budget risk    | High                                                                                       |
| Chained PRs recommended | Yes                                                                                        |
| Suggested split         | PR 1 (Search & Base) → PR 2 (Hero & Features) → PR 3 (Proof & Pricing) → PR 4 (Page & E2E) |
| Delivery strategy       | ask-on-risk                                                                                |
| Chain strategy          | pending                                                                                    |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                              | Likely PR | Notes                                         |
| ---- | ------------------------------------------------- | --------- | --------------------------------------------- |
| 1    | Foundation & Course Search Component              | PR 1      | Folder structure + `V2SearchBar` client logic |
| 2    | Visual Core: Hero & Features                      | PR 2      | `V2Hero` and `V2Features` implementation      |
| 3    | Conversion & Social Proof: Testimonials & Pricing | PR 3      | `V2Testimonials` and `V2Pricing` sections     |
| 4    | Integration, Route & Verification                 | PR 4      | `src/app/v2/page.tsx` + E2E Playwright tests  |

## Phase 1: Foundation & Search Interaction

- [x] 1.1 Create directory structure at `src/components/landing-v2/` (mapped to `src/components/v2/`).
- [x] 1.2 Implement `V2SearchBar.tsx` as a Client Component with input validation and `router.push` logic.
- [ ] 1.3 Create unit test `test/components/landing-v2/V2SearchBar.test.tsx` verifying validation and redirection.

## Phase 2: Core Visual Sections

- [x] 2.1 Implement `V2Hero.tsx` integrating `HeroCanvas` background and the `V2SearchBar`.
- [x] 2.2 Implement `V2Features.tsx` using `shadcn/ui` Cards to display platform benefits.

## Phase 3: Social Proof & Conversion

- [ ] 3.1 Implement `V2Testimonials.tsx` with a grid layout for user feedback.
- [ ] 3.2 Implement `V2Pricing.tsx` (CTA Section) with plans or a banner leading to subscription.

## Phase 4: Integration & Route

- [x] 4.1 Create `src/app/v2/page.tsx` composing all V2 components with global Header/Footer.
- [x] 4.2 Add SEO metadata (title, description, canonical) to `src/app/v2/page.tsx`.
- [ ] 4.3 Implement integration test verifying all sections render correctly on the `/v2` route.

## Phase 5: Verification & Cleanup

- [ ] 5.1 Create Playwright E2E test `test/e2e/landing-v2.spec.ts` for search flow and CTA navigation.
- [ ] 5.2 Perform a responsive audit (Mobile/Tablet/Desktop) and adjust Tailwind classes where needed.
- [ ] 5.3 Verify accessibility (Aria labels, keyboard navigation) on interactive components.
