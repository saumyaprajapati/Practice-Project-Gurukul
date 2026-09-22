# GURUKUL — LEARNING HUB IMPLEMENTATION DOCUMENT 2

## MY LEARNING + SEARCH & PAGINATION (absorbs former DASH-03 + DASH-04)

### PURPOSE

Build the "My Learning" page (`/gurukul/learning`) and the reusable Search + Pagination components, applied to both My Learning and the Buy Courses page built in Step 1.

Read `Dashboard-0 _ Overall.md` (shared foundation/contract) and `Dashboard-1 _ Foundation and Course Catalogue.md` (what already exists after Step 1) first. This document only adds the scope specific to Step 2.

Do not touch `Docs/Frontend/2_Authentication Page/`.

---

### 1. EXISTING CONTEXT AFTER STEP 1 (reuse, do not rebuild)

* `/gurukul` shell, Hub navbar, and route guard already exist — extend the guard to `/gurukul/learning`, don't re-implement it.
* Course/Enrollment mock repositories and the Course/Enrollment data-separation pattern already exist from Step 1 — extend them (fuller enrollment records: progress, status) rather than creating a second data layer.
* The Buy Courses page and its chaitya-arch course card already exist — Search and Pagination in this step must retrofit onto that existing page, not duplicate it.
* Profile control placement is unchanged (wherever `ProfileMenu` already renders it) — not touched by this step.

---

### 2. SCOPE

**My Learning (`/gurukul/learning`)**

* Shows courses where the learner has an *active* enrollment (expired enrollments do not count — they belong in Buy Courses instead, per Step 1's derivation rule).
* Heading tone: quiet/encouraging (e.g. "Your Learning" / "Continue your journey" — exact wording may be refined).
* Course card (extends the same chaitya-arch pattern from Step 1, now with a progress bar): title, category/instructor, progress %, and a state-driven CTA:

  ```text
  Not Started  → Start Learning
  In Progress  → Continue Learning
  Completed    → View Course
  ```

  Do not implement actual course playback.
* Empty state (no active courses) — calm, on-brand copy, not a generic illustration:

  ```text
  Your learning shelf is empty.
  There are courses waiting beyond the gate.
  [ Explore Courses ]
  ```

* Grid: same 4×4 desktop / responsive-down system as Buy Courses from Step 1.

**Search (reusable component)**

* Visibility rules:
  * Buy Courses: always visible.
  * My Learning: visible only when the learner has more than 16 active courses; otherwise hidden.
  * Anywhere else: hidden.
* Filters the *complete* relevant collection (not just the current page) — never highlight-while-still-showing-everything.
* Searchable fields: title, description, category, instructor. No relevance-ranking engineering — predictable substring/normalized filtering is enough for the mock phase.
* Empty-result state (not an empty 4×4 grid):

  ```text
  No courses found
  We couldn't find a course matching "[search term]".
  Try another search.
  ```

**Pagination (one reusable component, used by both Buy Courses and My Learning)**

* Previous / page numbers / Next.
* Hidden when `totalItems <= 16`, shown when `totalItems > 16`.
* Order of operations is filter-then-paginate, always:

  ```text
  allCourses → search/filter → filtered results → paginate → 16 visible
  ```

  Never paginate first and then search only the current page.
* A new search query resets pagination to page 1.

---

### 3. MUST NOT IMPLEMENT

* Real video/course playback.
* Backend full-text search, Elasticsearch, or any database-backed search.
* Password update / Profile page content.
* Unrelated landing-page changes.
* Backend/API/database/payment integration.

---

### 4. ACCEPTANCE CRITERIA

* My Learning shows only actively-enrolled courses, with correct per-course CTA state and a working empty state.
* Search appears on Buy Courses always, on My Learning only past 16 owned courses, and nowhere else.
* Search filters the full collection before pagination is applied, and resets to page 1 on a new query.
* Pagination is hidden at ≤16 items and appears correctly above that, on both grids.
* No second/competing session or route-guard mechanism was introduced.

---

### 5. REQUIRED FINAL REPORT

Follow the format defined in `Dashboard-0 _ Overall.md` §"Required final report." State explicitly:

```text
Step 3 is ready.
```

Do not implement Step 3 automatically.
