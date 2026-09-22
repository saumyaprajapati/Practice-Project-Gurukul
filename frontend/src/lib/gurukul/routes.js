// Single source of truth for Learning Hub route paths — mirrors
// lib/auth/routes.js's AUTH_ROUTES pattern.
export const GURUKUL_ROUTES = {
  home: "/gurukul",
  learning: "/gurukul/learning",
  courses: "/gurukul/courses",
  courseDetail: (courseId) => `/gurukul/courses/${courseId}`,
  checkout: (courseId) => `/gurukul/courses/${courseId}/checkout`,
};
