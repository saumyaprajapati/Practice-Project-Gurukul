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
  admin: "/gurukul/admin",
  adminCourses: "/gurukul/admin/courses",
  adminCourseEdit: (courseId) => `/gurukul/admin/courses/${courseId}`,
  adminUsers: "/gurukul/admin/users",
  adminUserProfile: (userId) => `/gurukul/admin/users/${userId}`,
  adminEnrollments: "/gurukul/admin/enrollments",
  adminDeletionRequests: "/gurukul/admin/deletion-requests",
};
