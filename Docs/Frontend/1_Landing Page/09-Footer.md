# Gurukul — Footer Implementation

## Objective
Replace all existing "Coming Soon" footer content with the
final Gurukul landing-page footer experience.

## Scope
ONLY:
- Footer
- Footer navigation
- Footer branding
- Footer visual treatment
- Footer responsiveness
- Footer accessibility

## Do NOT
- Modify backend
- Create backend APIs
- Create unrelated pages
- Add fake links
- Add fake social accounts
- Add fake company information
- Modify previously completed landing sections unless required
- Add unnecessary dependencies

## Requirements

1. Remove all "Coming Soon" footer placeholders.

2. Create the Gurukul footer using the approved visual language:
   - dark closing surface
   - Ajanta-inspired subtle visual treatment
   - restrained diya/light motif
   - Anek typography for UI
   - no generic SaaS gradient treatment

3. Include:
   - Gurukul brand
   - tagline
   - Learn navigation
   - Gurukul navigation
   - Support navigation
   - Legal navigation
   - available social links

4. Navigation must only point to routes/sections that actually exist.

5. If a destination does not exist:
   - do not invent a route
   - do not create unrelated pages
   - use an appropriate non-functional state or omit the item.

6. Make the footer fully responsive.

7. Ensure keyboard accessibility and visible focus states.

8. Respect prefers-reduced-motion.

9. Preserve all existing landing-page functionality.

## Implementation

First inspect:
- frontend/CLAUDE.md
- frontend/AGENTS.md
- frontend/package.json
- existing landing-page structure

Then implement the footer using the existing project architecture.

Reuse existing components/styles where appropriate.

Do not introduce a new styling system.

## Validation

Verify:
- no "Coming Soon" footer placeholders remain
- no broken links
- no console errors
- desktop layout works
- mobile layout works
- keyboard navigation works
- existing landing sections remain unaffected

## STOP CONDITION

Stop after the footer is implemented, responsive,
accessible, and integrated with the existing landing page.

Do not continue into backend implementation,
authentication, courses, payments, or other product functionality.