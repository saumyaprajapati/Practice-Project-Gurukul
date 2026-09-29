"use client";

import { useState } from "react";
import CourseGrid from "./CourseGrid";
import CourseSearch from "./CourseSearch";
import Pagination from "./Pagination";
import { searchCourses } from "@/lib/courses/search";
import { paginate } from "@/lib/courses/pagination";

// Composes search + pagination around a course grid, used by both Buy
// Courses and My Learning (Dashboard-2 §"Search + pagination"). Owns the
// query/page state so neither page has to duplicate it. `items` with zero
// entries is a different situation from a search finding zero matches —
// the former shows `emptyState`, the latter shows the "No courses found"
// copy, per Dashboard-2 §"My Learning empty state" vs §"Search empty state".
export default function CourseListing({
  items,
  renderCard,
  showSearch,
  searchPlaceholder = "Search courses...",
  emptyState,
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  if (items.length === 0) {
    return emptyState;
  }

  const filtered = searchCourses(items, query);
  const { pageItems, currentPage, totalPages } = paginate(filtered, page);

  function handleQueryChange(nextQuery) {
    setQuery(nextQuery);
    setPage(1);
  }

  return (
    <div>
      {showSearch ? (
        <CourseSearch value={query} onChange={handleQueryChange} placeholder={searchPlaceholder} />
      ) : null}

      {filtered.length === 0 ? (
        <div className="surface-earthy rounded-lg p-8 text-center">
          <p className="font-semibold text-charcoal">No courses found</p>
          <p className="mt-2 text-charcoal/80">
            We couldn&apos;t find a course matching &ldquo;{query}&rdquo;.
          </p>
          <p className="mt-1 text-charcoal/80">Try another search.</p>
        </div>
      ) : (
        <>
          <CourseGrid>{pageItems.map(renderCard)}</CourseGrid>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
