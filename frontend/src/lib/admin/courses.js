// Admin review-queue operations — course approval and deletion requests.
// Reads rely on the admin branches of the RLS policies; writes go through
// admin-only RPCs (admin_set_course_status, admin_review_deletion).
import { getSupabase } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/errors";

export async function getPendingCourses() {
  return unwrap(
    await getSupabase()
      .from("courses")
      .select("id, title, description, category, instructor, price, status, owner_id")
      .eq("status", "pending")
      .order("title")
  );
}

export async function approveCourse(courseId) {
  unwrap(await getSupabase().rpc("admin_set_course_status", { p_course_id: courseId, p_status: "approved" }));
  return { success: true };
}

export async function declineCourse(courseId) {
  unwrap(await getSupabase().rpc("admin_set_course_status", { p_course_id: courseId, p_status: "declined" }));
  return { success: true };
}

export async function getPendingDeletionRequests() {
  const rows = unwrap(
    await getSupabase()
      .from("course_deletion_requests")
      .select("id, course_id, requested_by, status, requested_at, courses(title)")
      .eq("status", "pending")
      .order("requested_at")
  );
  return rows.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.courses?.title ?? row.course_id,
    requestedBy: row.requested_by,
    status: row.status,
    requestedAt: row.requested_at,
  }));
}

export async function approveDeletionRequest(requestId) {
  unwrap(await getSupabase().rpc("admin_review_deletion", { p_request_id: requestId, p_approve: true }));
  return { success: true };
}

export async function declineDeletionRequest(requestId) {
  unwrap(await getSupabase().rpc("admin_review_deletion", { p_request_id: requestId, p_approve: false }));
  return { success: true };
}
