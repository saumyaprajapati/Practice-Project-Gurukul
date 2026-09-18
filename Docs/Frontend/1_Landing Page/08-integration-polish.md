GURUKUL — LANDING PAGE IMPLEMENTATION DOCUMENT 08
INTEGRATION + POLISH + FINAL QA

PURPOSE
Final pass after Documents 01–07 are implemented.

SCOPE RULE
Do NOT add new concepts or features.
Do NOT redesign the approved landing page.
Only integrate, fix inconsistencies, improve accessibility/performance, and resolve implementation issues.

REPOSITORY CONTEXT
Existing project:
Practice - Gurukul - 01/

Landing page lives in:
frontend/

Frontend uses:
Next.js
JavaScript (.js)
App Router
src/app/

Do not convert to TypeScript.
Do not modify backend unless a genuine existing integration bug makes it unavoidable.
Do not touch .next/ or node_modules/.

BEFORE CHANGES
Inspect:
- frontend/CLAUDE.md
- frontend/AGENTS.md
- frontend/package.json
- current page/component structure

Follow repository-specific instructions.

1. COMPLETE FLOW

Verify:
Hero
↓
Problem
↓
Platform Notices You
↓
Mentors
↓
Progress
↓
Learning Experience
↓
Languages
↓
Courses
↓
Performance
↓
Completion
↓
Final CTA
↓
Footer

The emotional progression should be:
DARKNESS
→ DISCOVERY
→ RECOGNITION
→ LEARNING
→ PROGRESS
→ ILLUMINATION
→ COMPLETION

2. TRANSITIONS
Check:
- dark/light background changes
- section spacing
- typography consistency
- shirorekha-inspired rules
- illumination continuity
- animation timing

Do not add decorative animation merely to fill gaps.

3. NAVIGATION
Verify:
- all navbar links
- section anchors
- mobile menu
- CTAs
- no dead links

4. RESPONSIVE QA
Test representative:
- small mobile
- large mobile
- tablet
- laptop
- large desktop

Fix:
- overflow
- clipped text
- broken arch shapes
- unusable mentor cards
- CTA overlap
- excessive gaps
- layout shifts

Use the smallest compatible fix.

5. ACCESSIBILITY
Verify:
- exactly one H1
- logical H2 hierarchy
- keyboard navigation
- visible focus
- sufficient contrast
- meaningful labels
- accessible mobile menu
- reduced motion
- animation never required for meaning
- mentor dialogue is readable
- progress milestones are readable

6. PERFORMANCE
Inspect:
- unnecessary 'use client'
- unnecessary client-side state
- image sizes
- lazy loading
- Rive/GSAP loading
- third-party scripts
- unnecessary font weights
- duplicated dependencies

Do not remove meaningful visual experience just to optimise blindly.

If a JavaScript budget is enforced by the project, measure the actual result rather than assuming compliance.

7. VISUAL CONSISTENCY
Verify:
- Anek is primary
- Tiro Devanagari Sanskrit only for mentor dialogue
- earthy Ajanta-inspired palette
- restrained gold
- chaitya arch for course imagery
- shirorekha-inspired rules
- diya/illumination metaphor
- coherent dark-to-light progression

Remove accidental:
- generic SaaS styling
- random gradients
- unrelated colours
- excessive shadows
- inconsistent radii
- decorative clutter

8. CONTENT INTEGRITY
Do not add:
- fake statistics
- fake testimonials
- fake ratings
- fake student counts
- unsupported performance claims
- invented historical quotations

If placeholder content exists, keep it clearly isolated and easy to replace.

9. CODE QUALITY
Check:
- duplicated components
- duplicated CSS
- unnecessary effects
- hydration errors
- console errors
- broken imports
- TypeScript-specific files accidentally introduced
- lint warnings/errors
- missing React keys
- accessibility warnings

Respect the existing JavaScript project structure.

10. FOLDER STRUCTURE
It is NORMAL for this work to create folders such as:

frontend/src/components/
frontend/src/components/landing/
frontend/src/components/landing/animations/
frontend/src/data/
frontend/src/lib/

Do not delete or flatten these merely because they were not in the original repository.

However:
- create folders only when they have a clear purpose
- avoid duplicate component directories
- keep landing-page-specific code grouped logically
- do not create unnecessary architecture

11. FINAL ACCEPTANCE

A visitor should understand:

WHAT IS GURUKUL?
An online learning platform designed around noticing learner behaviour.

WHY IS IT DIFFERENT?
It responds contextually instead of relying only on generic notifications.

WHAT ARE THE MENTORS?
Historical figures presented as contextual mentors/challengers.

WHAT DOES LEARNING LOOK LIKE?
A real course/video/quiz/progress experience.

WHO IS IT FOR?
Learners, including users learning in Indian languages and on ordinary mobile devices.

WHAT SHOULD I DO?
Enter the Gurukul.

FINAL RESTRICTIONS
Do not add:
- pricing
- authentication system
- dashboards
- backend functionality
- payments
- course management
- unrelated pages
- new product features

Those are separate tasks.

FINAL OUTCOME
The eight implementation stages should now feel like one coherent landing page.

The page should behave like the product philosophy:
it notices the visitor's attention, guides them progressively, reveals information at the right moment, and leads them from darkness into light.

STOP.
