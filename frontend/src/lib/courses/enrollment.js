// Mock Enrollment repository — deliberately separate from the Course
// repository (lib/courses/courses.js). Enrollment is per-user access state
// (purchasedAt/expiresAt/status/progress), never a permanent property of a
// course. Only "mock-user" exists for this prototype phase; a real backend
// would key this off the authenticated user's id.
const MOCK_USER_ID = "mock-user";

export const ENROLLMENTS = [
  { courseId: "python-foundations", userId: MOCK_USER_ID, purchasedAt: "2026-06-01", expiresAt: "2027-06-01", status: "active", progress: 40 },
  { courseId: "react-in-depth", userId: MOCK_USER_ID, purchasedAt: "2026-08-01", expiresAt: "2027-08-01", status: "active", progress: 10 },
  { courseId: "linux-command-line", userId: MOCK_USER_ID, purchasedAt: "2026-09-01", expiresAt: "2027-09-01", status: "active", progress: 0 },
  { courseId: "data-visualization", userId: MOCK_USER_ID, purchasedAt: "2026-02-01", expiresAt: "2027-02-01", status: "active", progress: 100 },
  { courseId: "sql-for-everyone", userId: MOCK_USER_ID, purchasedAt: "2025-01-01", expiresAt: "2026-01-01", status: "expired", progress: 65 },
  { courseId: "git-and-github", userId: MOCK_USER_ID, purchasedAt: "2025-03-01", expiresAt: "2026-03-01", status: "expired", progress: 20 },
];

export function getCurrentUserId() {
  return MOCK_USER_ID;
}

export function getEnrollmentForCourse(courseId, userId = getCurrentUserId()) {
  return ENROLLMENTS.find((e) => e.courseId === courseId && e.userId === userId) ?? null;
}

export function getEnrollmentsForUser(userId = getCurrentUserId()) {
  return ENROLLMENTS.filter((e) => e.userId === userId);
}

export function hasActiveAccess(enrollment) {
  if (!enrollment) return false;
  return enrollment.status === "active" && new Date(enrollment.expiresAt) > new Date();
}

// Derives the My Learning CTA state from progress alone — status/expiry are
// what hasActiveAccess() cares about, not this.
export function getCourseState(enrollment) {
  if (!enrollment || enrollment.progress === 0) return "not-started";
  if (enrollment.progress >= 100) return "completed";
  return "in-progress";
}
