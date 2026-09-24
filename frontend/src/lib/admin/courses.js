// Admin course operations — review queue (approval + deletion requests) and
// full management of any course and its content. Reads rely on the admin
// branches of the RLS policies; writes go through the admin-only RPCs in
// supabase/phase5b-baas.sql and phase6-admin.sql.
import { getSupabase } from "@/lib/supabase/client";
import { toApiError, unwrap } from "@/lib/supabase/errors";

// The FK hint is required: courses and profiles are also linked many-to-many
// through enrollments, so a bare `profiles(name)` embed would be ambiguous.
const ADMIN_COURSE_FIELDS =
  "id, title, description, category, instructor, thumbnail, price, status, owner_id, created_at, owner:profiles!courses_owner_id_fkey(name), enrollments(count)";

function mapAdminCourse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    instructor: row.instructor,
    thumbnail: row.thumbnail,
    price: row.price,
    status: row.status,
    ownerId: row.owner_id,
    ownerName: row.owner?.name ?? null,
    createdAt: row.created_at,
    enrollmentCount: row.enrollments?.[0]?.count ?? 0,
  };
}

// ---- review queue -----------------------------------------------------------

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

// ---- every course, any status -------------------------------------------------

export async function getAllCoursesForAdmin() {
  const rows = unwrap(await getSupabase().from("courses").select(ADMIN_COURSE_FIELDS).order("title"));
  return rows.map(mapAdminCourse);
}

export async function getCourseForAdmin(courseId) {
  const { data, error } = await getSupabase()
    .from("courses")
    .select(ADMIN_COURSE_FIELDS)
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw toApiError(error);
  return data ? mapAdminCourse(data) : null;
}

export async function updateCourse(courseId, { title, description, category, instructor, price, status, ownerId, thumbnail }) {
  unwrap(
    await getSupabase().rpc("admin_update_course", {
      p_course_id: courseId,
      p_title: title,
      p_description: description,
      p_category: category,
      p_instructor: instructor,
      p_price: price,
      p_status: status,
      p_owner_id: ownerId || null,
      p_thumbnail: thumbnail || null,
    })
  );
  return { success: true };
}

export async function deleteCourse(courseId) {
  unwrap(await getSupabase().rpc("admin_delete_course", { p_course_id: courseId }));
  return { success: true };
}

// ---- modules and lessons --------------------------------------------------------
// Lessons are addressed by (courseId, lessonKey) — lessonKey is the `id`
// getCourseCurriculum() returns for each lesson.

export async function updateModule(moduleId, title) {
  unwrap(await getSupabase().rpc("admin_update_module", { p_module_id: moduleId, p_title: title }));
}

export async function deleteModule(moduleId) {
  unwrap(await getSupabase().rpc("admin_delete_module", { p_module_id: moduleId }));
}

export async function moveModule(moduleId, direction) {
  unwrap(await getSupabase().rpc("admin_move_module", { p_module_id: moduleId, p_direction: direction }));
}

export async function updateLesson(courseId, lessonKey, { title, content, durationMinutes, isPreview }) {
  unwrap(
    await getSupabase().rpc("admin_update_lesson", {
      p_course_id: courseId,
      p_lesson_key: lessonKey,
      p_title: title,
      p_content: content,
      p_duration_minutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      p_is_preview: Boolean(isPreview),
    })
  );
}

export async function deleteLesson(courseId, lessonKey) {
  unwrap(await getSupabase().rpc("admin_delete_lesson", { p_course_id: courseId, p_lesson_key: lessonKey }));
}

export async function moveLesson(courseId, lessonKey, direction) {
  unwrap(
    await getSupabase().rpc("admin_move_lesson", {
      p_course_id: courseId,
      p_lesson_key: lessonKey,
      p_direction: direction,
    })
  );
}
