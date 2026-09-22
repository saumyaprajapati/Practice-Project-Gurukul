import "server-only";

// DB row -> the same {courseId, userId, status, purchasedAt, expiresAt,
// progress} shape the mock ENROLLMENTS objects used, so every existing
// pure consumer (hasActiveAccess, getCourseState, the card components)
// keeps working unchanged against real data.
export function mapEnrollmentRow(row) {
  if (!row) return null;
  return {
    courseId: row.course_id,
    userId: row.user_id,
    status: row.status,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at,
    progress: row.progress_percent,
  };
}
