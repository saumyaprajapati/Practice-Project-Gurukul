// Enrollment repository — the `enrollments_select_own` RLS policy scopes
// every read to the signed-in user; writes only happen through the
// checkout()/create_course() RPCs. hasActiveAccess/getCourseState stay pure
// and unchanged: they only derive from the mapped enrollment shape.
import { getSupabase } from "@/lib/supabase/client";
import { toApiError, unwrap } from "@/lib/supabase/errors";
import { COURSE_FIELDS } from "@/lib/courses/courses";

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

export async function getEnrollmentForCourse(courseId) {
  const { data, error } = await getSupabase().from("enrollments").select("*").eq("course_id", courseId).maybeSingle();
  if (error) throw toApiError(error);
  return mapEnrollmentRow(data);
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

async function loadCoursesWithEnrollments({ approvedOnly }) {
  const supabase = getSupabase();
  let coursesQuery = supabase.from("courses").select(COURSE_FIELDS).order("title");
  if (approvedOnly) coursesQuery = coursesQuery.eq("status", "approved");

  const [coursesResult, enrollmentsResult] = await Promise.all([coursesQuery, supabase.from("enrollments").select("*")]);
  const courses = unwrap(coursesResult);
  const enrollmentByCourseId = new Map(unwrap(enrollmentsResult).map((row) => [row.course_id, mapEnrollmentRow(row)]));
  return courses.map((course) => ({ course, enrollment: enrollmentByCourseId.get(course.id) ?? null }));
}

// Courses the caller currently has active access to (any status) -> { items }
export async function getMyLearning() {
  const items = (await loadCoursesWithEnrollments({ approvedOnly: false })).filter(({ enrollment }) =>
    hasActiveAccess(enrollment)
  );
  return { items };
}

// Approved courses with no active enrollment — never purchased, or expired -> { items }
export async function getPurchasableCourses() {
  const items = (await loadCoursesWithEnrollments({ approvedOnly: true })).filter(
    ({ enrollment }) => !hasActiveAccess(enrollment)
  );
  return { items };
}

// Mock purchase (first purchase or renewal) -> { enrollment }
export async function checkoutCourse(courseId) {
  const row = unwrap(await getSupabase().rpc("checkout", { p_course_id: courseId }));
  return { enrollment: mapEnrollmentRow(row) };
}
