# Gurukul — Learning Hub

## Master Foundation & Contract

**Document status:** Implementation specification (shared foundation — mirrors `AUTH-00` for the Learning Hub)
**Feature:** Learning Hub / Course Marketplace
**Implementation strategy:** Incremental, step-isolated (3 steps)
**Frontend-first:** Yes
**Backend integration:** Deferred
**Primary objective:** Build a course marketplace + personal learning environment that feels like entering the Gurukul, not entering a generic LMS dashboard.

This document defines shared context, principles and process. It does **not** implement any individual screen. Screen-level scope lives in:

```text
Dashboard-1 _ Foundation and Course Catalogue.md
Dashboard-2 _ My Learning and Search-Pagination.md
Dashboard-3 _ Profile and Integration QA.md
```

---

# 1. Purpose

This document defines the shared foundation for Gurukul's next major frontend feature: the **Learning Hub**.

The Learning Hub is intentionally **not a conventional analytics dashboard**. It combines:

1. A personal learning area for courses the learner currently owns.
2. A course marketplace for discovering and purchasing courses.
3. Contextual course search.
4. Course pagination.
5. Profile access and password-update UI.
6. The existing authenticated navigation/session behaviour.

The experience must feel like a natural continuation of the existing Gurukul website. The project concept defines a journey of:

> browse → enrol → watch → quiz → fall behind → finish

and the new interface should support that journey rather than introducing a generic dashboard/administration aesthetic.

---

# 2. Existing project context (already implemented — reuse, do not rebuild)

## 2.1 Landing page

Complete: Hero, Navbar, Problem/Platform Notices, Mentors, Progress, Product Experience, Languages, Courses, Course Cards, Performance, Completion, Final CTA, Footer. Do not unnecessarily redesign any of it as part of this feature.

## 2.2 Authentication (AUTH-00 → AUTH-06)

Complete and out of scope for this feature. Routes: `/auth/signup`, `/auth/login`, `/auth/recovery`, `/auth/code`, `/profile` (route exists; its content is Step 3's job — see below). Components: `AuthLayout`, `AuthCard`, `AuthHeader`, `AuthInput`, `AuthButton`, `AuthError`, `AuthFooterNav`, `Captcha`, `HoneypotField`. Authentication is mocked/client-side by design, architected so a real backend can replace it later without rebuilding the screens. *(Phase 5: that backend is now Supabase Auth, and `Captcha` was replaced by `TurnstileWidget` — see `frontend/supabase/README-phase5.md`.)*

**Do not modify anything under `Docs/Frontend/2_Authentication Page/` or its implementation.** Those documents exactly describe what they had to build, and it was built as specified.

## 2.3 Session — the single source of truth

`lib/auth/session.js` (`isAuthenticated` / `setAuthenticated` / `clearAuthenticated`) is the only authenticated-state mechanism in the project. It already drives:

* the landing Navbar's authenticated vs. unauthenticated state
* the Hero/Final CTA "Enter the Gurukul" controls disappearing once authenticated
* the profile menu and sign-out

**Do not create a second session mechanism for the Learning Hub.** Reuse `lib/auth/session.js` directly.

## 2.4 Profile control — reuse as-is, do not reposition

`components/landing/ProfileMenu.js` + `ProfileIcon.js` already implement the "View Profile / Sign Out" dropdown (click-outside + Escape handling included), and are already rendered by the existing Navbar wherever it places them today (the trailing/right end of the nav list). The Learning Hub navbar must reuse these components exactly as they are, in that same position. Do not invent or claim a different placement (e.g. "top-left") anywhere in the Learning Hub docs or implementation — no such convention exists in the current codebase.

## 2.5 Design tokens

The Ajanta-inspired palette, Anek typography, chaitya-arch thumbnail treatment, and shirorekha-inspired rules are not just a described language — they already exist as reusable CSS utility classes (`surface-earthy`, `section-manuscript`, `heading-2`, `rule-shirorekha`, `text-ochre`, etc.), confirmed in use across the landing page and the existing profile placeholder. Reuse these tokens; do not invent a parallel set. `components/landing/CourseCard.js` already implements the chaitya-arch `clipPath` pattern — extend it for Learning Hub cards rather than re-deriving the arch from scratch.

---

# 3. Backend status

The backend is **NOT implemented yet**. It is currently an Express skeleton with a single `/health` route. The intended long-term stack is:

```text
Next.js / React
        ↓
Express + TypeScript
        ↓
PostgreSQL + Drizzle
        ↓
BullMQ + Redis
        ↓
Cloudflare R2
```

## Do NOT implement real backend functionality as part of the Learning Hub work.

Do not invent: database tables, API endpoints, authentication APIs, payment APIs, Razorpay integration, PostgreSQL queries, Drizzle schemas, Redis jobs, or course APIs — unless a later document explicitly requests them. Use a clean mock/service boundary so the backend can replace the mock implementation later.

---

# 4. Core product concept

The Learning Hub should feel like:

> **The learner has entered the Gurukul.**

It should NOT feel like an admin dashboard, a SaaS analytics application, a generic LMS, a shopping website, or a corporate account portal.

The visual system must remain consistent with the existing Gurukul design (§2.5): dark landing experience, light/manuscript learning surfaces, Ajanta-inspired palette (charcoal, red ochre, turmeric gold, cream, brown, restrained lapis), Anek typography, Tiro Devanagari Sanskrit reserved for historical-character dialogue, chaitya-arch course thumbnails, shirorekha-inspired horizontal gold rules. These principles continue into the Learning Hub without modification.

---

# 5. Feature terminology

## Preferred

```text
Learning Hub
My Learning
Buy Courses
Courses
Profile
Continue Learning
Explore Courses
```

## Avoid

```text
Dashboard
Admin
Analytics Dashboard
Workspace
Store
Marketplace UI
```

"Dashboard" may be used internally as a technical description (as in this folder's name), but visible product language should prefer **Learning Hub**.

---

# 6. High-level information architecture

```text
                         GURUKUL
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
     My Learning       Buy Courses         Profile
          │                 │                 │
     owned courses      catalogue       account information
          │                 │                 │
          └─────────── course discovery ─────┘
```

Recommended routes: `/gurukul`, `/gurukul/learning`, `/gurukul/courses`, `/profile`. Follow the existing project's routing conventions rather than inventing a new pattern. Which step builds which route is defined in the step documents.

---

# 7. Authentication guard (shared principle)

`/gurukul`, `/gurukul/learning`, `/gurukul/courses`, and `/profile` all require authentication. Unauthenticated access returns the visitor to the existing `/auth/login` flow. Authenticated users visiting `/auth/login` / `/auth/signup` continue to follow existing AUTH-06 behaviour — do not modify it. Each step document states exactly which of these routes it is responsible for guarding, since the routes are built incrementally across the three steps.

---

# 8. Animation, performance, accessibility

**Animation** — subtle page transitions, restrained hover motion, smooth filtering transitions, the existing dropdown animation, lightweight card interactions. Avoid excessive parallax, dashboard-style animated charts, bouncing, flashy marketplace effects, or anything that interferes with navigation. The project's tiered animation philosophy (device/connection-aware) continues to apply; do not introduce a separate animation framework without first checking what exists.

**Performance** — stay lightweight. Do not introduce large libraries for pagination, search, dropdowns, grids, or simple transitions. Inspect `package.json` and prefer existing dependencies/native React before adding anything.

**Accessibility** — keyboard navigation, visible focus states, semantic buttons, accessible form labels, accessible profile dropdown, meaningful alt text, meaningful empty states, sufficient contrast, pagination controls that communicate current page. Never rely on colour alone to communicate course state.

---

# 9. Implementation strategy

The feature is implemented across **3 isolated steps** (not one session):

```text
AUTH-06
   │
   ▼
Step 1 — Foundation & Course Catalogue
   │
   ▼
Step 2 — My Learning & Search + Pagination
   │
   ▼
Step 3 — Profile & Integration/QA
   │
   ▼
Future backend implementation
```

Each step's session should:

1. Read `Dashboard-0` (this doc) plus its own step document and any prior step documents.
2. Inspect the current repository before modifying anything — do not assume file paths, component names, or architecture.
3. Implement only that step's scope; avoid implementing future steps.
4. Reuse existing code (navbar, profile dropdown, session utility, card component, animation utility, typography/colour tokens) — do not create duplicate equivalents.
5. If a backend dependency is missing: **stop at the service/mock boundary.** Do not invent an API.
6. Do not silently redesign existing pages or refactor unrelated code.
7. Before adding a dependency: inspect `package.json`, determine whether an existing dependency already solves the problem.
8. Run appropriate checks/tests, verify in-browser where appropriate — a component is not complete merely because it compiles.
9. Report changed files, assumptions, and known limitations (format below).
10. Stop when the step is complete; do not auto-start the next step.

---

# 10. Required final report from each step's session

```text
1. Implemented        — exactly what was implemented
2. Files changed      — Created / Modified / Deleted
3. Behaviour verified — actual flows tested
4. Tests/checks       — lint / build / tests / browser verification (only what was actually run)
5. Assumptions        — explicitly listed
6. Known limitations  — anything intentionally deferred
7. Next step          — e.g. "Step 2 is ready." Do not implement it automatically.
```

---

# 11. Long-term backend compatibility

The frontend is a prototype of the eventual system. The eventual backend can replace the Mock Course Repository with a Course API, and the Mock Enrollment Repository with an Enrollment API, without requiring the course UI to be redesigned — provided the route → controller → service → repository boundary is preserved even while using mock data. Do not directly couple React components to hypothetical database structures.

---

# 12. Final product principle

The Learning Hub should communicate **"You have entered the Gurukul,"** not "You have entered a dashboard." The landing page begins in darkness and learning surfaces transition into light — the Learning Hub is the first substantial light/manuscript surface the learner reaches after entering the product. The product's central idea remains **a teacher who notices you**: the Hub prioritizes *your courses, your progress, your next step* over statistics, charts, or administrative widgets.

---

# 13. Implementation boundary

At the end of Step 3, the expected result is: a complete frontend Learning Hub + mock course/enrollment data + the existing authentication/session behaviour + a real Profile UI.

It is **not**: real payments, real database, real course API, real password API, real video delivery, or real enrollment processing. Those belong to later backend/product phases. The goal of these three steps is a stable, visually consistent, backend-ready Learning Hub frontend, without letting future requirements contaminate the current implementation.
