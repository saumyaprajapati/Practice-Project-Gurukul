// Normalized, case-insensitive substring filtering over title/description/
// category/instructor. No relevance ranking — predictable filtering is
// enough for the mock phase (Dashboard-2 §"Frontend search implementation"
// carries this rule over from the earlier master spec). Operates on the
// same {course, enrollment} shape both derive.js functions return, so it
// works unmodified for both Buy Courses and My Learning.
function normalize(value) {
  return value.trim().toLowerCase();
}

export function searchCourses(items, query) {
  const normalizedQuery = normalize(query ?? "");
  if (!normalizedQuery) return items;

  return items.filter(({ course }) => {
    const haystack = [course.title, course.description, course.category, course.instructor]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
