# GURUKUL — LEARNING HUB IMPLEMENTATION DOCUMENT 3

## PROFILE + INTEGRATION & QA (absorbs former DASH-05 + DASH-06)

### PURPOSE

Build the real `/profile` page content, then run a full integration/QA pass across everything built in Steps 1–3.

Read `Dashboard-0 _ Overall.md` (shared foundation/contract), `Dashboard-1` and `Dashboard-2` (what already exists) first. This document only adds the scope specific to Step 3.

Do not touch `Docs/Frontend/2_Authentication Page/`.

---

### 1. EXISTING CONTEXT (reuse, do not rebuild)

* `app/profile/page.js` currently exists only as a placeholder ("Your profile is on its way") — the route exists, its content does not. This step replaces that placeholder body; it does not create a new route.
* `lib/auth/session.js` remains the sole session source of truth; `ProfileMenu.js`/`ProfileIcon.js` remain unchanged and already link to `/profile` and expose "Sign Out."
* Design tokens (`surface-earthy`, `section-manuscript`, `heading-2`, `rule-shirorekha`, etc.) are already in use on the current placeholder page — keep using them.
* Hub shell, route guard, Buy Courses, My Learning, Search, and Pagination all exist after Steps 1–2 — this step integrates with them, it doesn't rebuild them.

---

### 2. SCOPE

**Profile (`/profile`)**

* Content:

  ```text
  Profile

  Name    [read-only]
  Email   [read-only]

  Password  [editable]
  New Password
  Confirm Password
  [ Update Password ]
  ```

* Only password fields are editable in this version — no name/email editing controls.
* Password-update flow: new password → confirm password → validation → mock update service. Do not claim a server actually changed anything; architect the mock so a real API can replace it later without UI changes.
* Route guard confirmed on `/profile` (extend the guard from Steps 1–2 if it wasn't already covering this route).

**Integration & QA**

* Walk the full Learning Hub flow end-to-end: sign in → Hub shell → Buy Courses → search/paginate → (mock) enrollment → My Learning → course states → Profile → password update → Sign Out.
* Regression-check that Steps 1–2 still work together (nothing in this step should require re-touching their code except genuine integration bugs).
* Responsive sweep: mobile / tablet / desktop for all Hub pages.
* Accessibility sweep: keyboard navigation, visible focus states, accessible form labels, accessible profile dropdown, meaningful empty states, sufficient contrast, pagination communicates current page.
* Visual consistency sweep: typography, palette, chaitya-arch card treatment, and animation restraint are consistent across Buy Courses, My Learning, and Profile.
* No new major functionality should be introduced during this phase — this is verification and bug-fixing, not new scope.

---

### 3. MUST NOT IMPLEMENT

* Real password API, database, email verification, or account deletion.
* Real payments, real course API, real video delivery, real enrollment processing.
* Any new feature not already specified in Steps 1–2.

---

### 4. ACCEPTANCE CRITERIA (Definition of Done for the full Learning Hub)

**Navigation** — profile appears authenticated; My Learning, Buy Courses, Profile, and Sign Out all work.

**My Learning** — active courses appear with correct progress and CTA; empty state works; 16-item page limit and conditional pagination work.

**Buy Courses** — unowned and expired courses appear; actively-owned courses do not; cards work; pagination appears only when necessary.

**Search** — appears in Buy Courses always, in My Learning only past 16 owned courses; filters correctly; resets pagination; handles zero results.

**Profile** — user info displays; name/email are read-only; password fields validate and mock-update correctly.

**Visual** — existing typography/palette preserved; chaitya-arch card language consistent; learning surfaces remain light/manuscript-inspired; animation stays restrained.

**Technical** — existing session architecture reused with no duplicate mechanism; Course/Enrollment data stays separated; mock/service boundary intact; no fake backend APIs; no unnecessary dependencies; unrelated pages (landing page, auth pages) unmodified.

---

### 5. REQUIRED FINAL REPORT

Follow the format defined in `Dashboard-0 _ Overall.md` §"Required final report." This is the final step — state explicitly that the frontend Learning Hub is complete per Dashboard-0's "Important implementation boundary" (mock data + existing auth/session behaviour + profile UI; no real backend), and list anything intentionally deferred to the future backend phase.
