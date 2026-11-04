// Single source of truth for Learning Hub route paths — mirrors
// lib/auth/routes.js's AUTH_ROUTES pattern.
//
// Per-course/per-user pages take the id as a query string (?id=) rather than
// a [courseId] path segment: the site is a static export (GitHub Pages), and
// ids only exist in the database, so each of these is one prebuilt page that
// reads its id in the browser. Extra params must be appended with "&".
const withId = (path, id) => `${path}?id=${encodeURIComponent(id)}`;

export const GURUKUL_ROUTES = {
  home: "/gurukul",
  learning: "/gurukul/learning",
  courses: "/gurukul/courses",
  courseDetail: (courseId) => withId("/gurukul/courses/view", courseId),
  checkout: (courseId) => withId("/gurukul/courses/checkout", courseId),
  createCourse: "/gurukul/create-course",
  myCourses: "/gurukul/my-courses",
  myCourseAddContent: (courseId) => withId("/gurukul/my-courses/add-content", courseId),
  myCourseAnalytics: (courseId) => withId("/gurukul/my-courses/analytics", courseId),
  admin: "/gurukul/admin",
  adminCourses: "/gurukul/admin/courses",
  adminCourseEdit: (courseId) => withId("/gurukul/admin/courses/edit", courseId),
  adminUsers: "/gurukul/admin/users",
  adminUserProfile: (userId) => withId("/gurukul/admin/users/profile", userId),
  adminEnrollments: "/gurukul/admin/enrollments",
  adminDeletionRequests: "/gurukul/admin/deletion-requests",
};
