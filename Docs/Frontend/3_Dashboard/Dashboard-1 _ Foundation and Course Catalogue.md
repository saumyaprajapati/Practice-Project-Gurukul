# GURUKUL — LEARNING HUB IMPLEMENTATION DOCUMENT 1

## FOUNDATION + COURSE CATALOGUE (absorbs former DASH-01 + DASH-02)

### PURPOSE

Establish the authenticated Learning Hub shell (`/gurukul`) and the course marketplace (`/gurukul/courses` — "Buy Courses"), including the minimum mock data needed for Buy Courses to correctly exclude courses the learner already owns.

Read `Dashboard-0 _ Overall.md` first. It is the shared foundation/contract for the whole Learning Hub (product concept, terminology, design-system reuse rules, backend boundary, Code Harness rules, report format). This document only adds the scope specific to Step 1.

Do not touch `Docs/Frontend/2_Authentication Page/` or its implementation — that work is complete and out of scope here.

---

### 1. EXISTING CONTEXT (reuse, do not rebuild)

* `lib/auth/session.js` — sole source of truth for `isAuthenticated()`. Reuse directly; do not create a second session mechanism.
* `components/landing/ProfileMenu.js` + `ProfileIcon.js` — already implement the "View Profile / Sign Out" dropdown, click-outside and Escape handling included. Reuse as-is in the Hub navbar.
* **Profile control placement**: keep it exactly where `ProfileMenu` already renders it in the existing Navbar (the trailing/right end of the nav list). Do not move it to a "top-left" position — no such placement exists anywhere in the current implementation.
* `components/landing/CourseCard.js` — already implements the chaitya-arch `clipPath` treatment and the `surface-earthy` card shell. Its current shape (`title`, `lessons`, `level`, `image`, a link to signup) is landing-page-only and insufficient for this step — extend the *visual pattern*, don't re-derive the arch clip-path from scratch, but build a new card for the catalogue's actual data (title, category, instructor, price, CTA).
* `lib/auth/routes.js` (`AUTH_ROUTES`, `getPostAuthDestination`) and `components/landing/cta.js` (`ENTER_GURUKUL_HREF`, `PROFILE_HREF`) — existing pattern for centralizing route constants. Extend this pattern for the new Hub routes rather than hardcoding paths inline.
* Design tokens already shipped as CSS utility classes and confirmed in use (e.g. on `app/profile/page.js`): `surface-earthy`, `section-manuscript`, `heading-2`, `rule-shirorekha`, `text-ochre`. Reuse these; do not invent a parallel token set.

---

### 2. SCOPE

* Authenticated Learning Hub shell at `/gurukul`.
* Hub navbar: `[Profile]  GURUKUL  My Learning  Buy Courses` (profile control unchanged from its current placement; "My Learning" links to `/gurukul/learning`, which does not need to render anything yet — that page ships in Step 2, but the link/route can exist as a stub if convenient).
* Route guard applied to `/gurukul` and `/gurukul/courses`: unauthenticated visitors are sent back into the existing `/auth/login` flow. (Do not modify existing `/auth/*` redirect behaviour — only add the new guard for Hub routes.)
* Course data model + mock course repository (`lib/courses/` or wherever existing repo conventions place it — inspect before creating).
* A minimal Enrollment model + mock enrollment repository — only what Buy Courses needs to derive "does this learner already have active access." The full My Learning experience (progress display, Start/Continue/View states) is Step 2's job; this step only needs enough enrollment data to filter correctly.
* Course/Enrollment separation (do not store `progress`/`purchasedByUser`/`expiresAt` as permanent properties of the course object):

  ```text
  Course:      id, title, description, category, instructor, thumbnail, price
  Enrollment:  courseId, userId, purchasedAt, expiresAt, status, progress
  ```

* Buy Courses page at `/gurukul/courses`:
  * Shows courses with no active enrollment — both never-purchased and expired-access courses.
  * Excludes courses the learner currently has active access to.
  * Expired access uses calm language ("Access expired" / "Renew Access"), never shame language ("EXPIRED!!!", "YOU FAILED").
* Buy Course card (extends the chaitya-arch pattern above): title, short description, price, `[ View Course ]` CTA (or `[ Renew Access ]` for expired). Payment is not implemented — the CTA may be a placeholder or navigate to a future detail page.
* Grid: 4 columns × 4 rows desktop target (16/page), responsive down to 2–3 columns tablet / 1 column mobile. Do not force 4 columns on small screens.
* Pagination: **not required yet** if the mock catalogue is small enough to fit one page. If you do need to structure the grid for more than 16 items, keep the logic minimal — the reusable Pagination *component* is Step 2's job; don't build a second one there.

---

### 3. MUST NOT IMPLEMENT

* My Learning page (`/gurukul/learning`) content.
* Search.
* The reusable Pagination component (a hardcoded "16 or fewer, no pagination" grid is fine for this step).
* Password update / Profile page content.
* Any backend/API/database/payment integration — stop at the mock/service boundary per Dashboard-0.

---

### 4. ACCEPTANCE CRITERIA

* `/gurukul` renders the authenticated shell with the Hub navbar; unauthenticated visitors are redirected into the auth flow.
* `/gurukul/courses` shows the mock catalogue, correctly excluding actively-owned courses and correctly showing expired-access courses with calm copy.
* Course cards use the existing chaitya-arch/`surface-earthy` visual language, not a newly invented card style.
* No duplicate session/auth mechanism was introduced.
* Course and Enrollment mock data are structurally separate, not merged into one object.

---

### 5. REQUIRED FINAL REPORT

Follow the format defined in `Dashboard-0 _ Overall.md` §"Required final report" (Implemented / Files changed / Behaviour verified / Tests-checks / Assumptions / Known limitations / Next step). State explicitly:

```text
Step 2 is ready.
```

Do not implement Step 2 automatically.
