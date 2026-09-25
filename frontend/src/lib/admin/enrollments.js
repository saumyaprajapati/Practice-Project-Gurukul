// Admin enrollment management — every learner's access and progress.
import { getSupabase } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/errors";

export async function getAllEnrollments() {
  const rows = unwrap(await getSupabase().rpc("admin_list_enrollments"));
  return rows.map((row) => ({
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    courseId: row.course_id,
    courseTitle: row.course_title,
    status: row.status,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at,
    progress: row.progress_percent,
    completedLessons: Number(row.completed_lessons),
  }));
}

// One user's enrollments with their course, for the admin profile page
// (readable thanks to the enrollments_select_admin policy).
export async function getEnrollmentsForUser(userId) {
  const rows = unwrap(
    await getSupabase()
      .from("enrollments")
      .select("*, courses(id, title, category, instructor, status)")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false })
  );
  return rows.map((row) => ({
    userId: row.user_id,
    courseId: row.course_id,
    courseTitle: row.courses?.title ?? row.course_id,
    category: row.courses?.category ?? "",
    instructor: row.courses?.instructor ?? "",
    courseStatus: row.courses?.status ?? null,
    status: row.status,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at,
    progress: row.progress_percent,
  }));
}

export async function grantEnrollment(userId, courseId, days = 365) {
  unwrap(
    await getSupabase().rpc("admin_grant_enrollment", { p_user_id: userId, p_course_id: courseId, p_days: days })
  );
}

export async function revokeEnrollment(userId, courseId) {
  unwrap(await getSupabase().rpc("admin_revoke_enrollment", { p_user_id: userId, p_course_id: courseId }));
}

// expiresAt: a Date or ISO string.
export async function setEnrollmentExpiry(userId, courseId, expiresAt) {
  unwrap(
    await getSupabase().rpc("admin_set_enrollment_expiry", {
      p_user_id: userId,
      p_course_id: courseId,
      p_expires_at: new Date(expiresAt).toISOString(),
    })
  );
}

export async function resetProgress(userId, courseId) {
  unwrap(await getSupabase().rpc("admin_reset_progress", { p_user_id: userId, p_course_id: courseId }));
}

export async function deleteEnrollment(userId, courseId) {
  unwrap(await getSupabase().rpc("admin_delete_enrollment", { p_user_id: userId, p_course_id: courseId }));
}
