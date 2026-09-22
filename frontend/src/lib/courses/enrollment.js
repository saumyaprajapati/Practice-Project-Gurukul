// Enrollment repository — talks to the real /api/enrollments routes,
// scoped server-side to the authenticated user (see lib/server/auth.js).
// hasActiveAccess/getCourseState stay pure and unchanged: they only ever
// derive from the enrollment shape returned by the API, which mirrors the
// old mock ENROLLMENTS objects field-for-field on purpose.
import { apiFetch } from "@/lib/apiClient";

export async function getEnrollmentForCourse(courseId) {
  const { enrollment } = await apiFetch(`/api/enrollments/${courseId}`);
  return enrollment;
}

export async function getEnrollmentsForUser() {
  const { enrollments } = await apiFetch("/api/enrollments");
  return enrollments;
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
