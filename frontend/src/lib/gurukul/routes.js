// Single source of truth for Learning Hub route paths — mirrors
// lib/auth/routes.js's AUTH_ROUTES pattern.
export const GURUKUL_ROUTES = {
  home: "/gurukul",
  learning: "/gurukul/learning",
  courses: "/gurukul/courses",
  courseDetail: (courseId) => `/gurukul/courses/${courseId}`,
  checkout: (courseId) => `/gurukul/courses/${courseId}/checkout`,
  createCourse: "/gurukul/create-course",
  myCourses: "/gurukul/my-courses",
  myCourseAddContent: (courseId) => `/gurukul/my-courses/${courseId}/add-content`,
  adminCourses: "/gurukul/admin/courses",
  adminDeletionRequests: "/gurukul/admin/deletion-requests",
};
