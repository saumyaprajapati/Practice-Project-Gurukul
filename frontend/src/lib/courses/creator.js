// Instructor-side course operations — creating a course, appending content
// to an existing one of your own, and requesting its deletion. Writes go
// through the RPCs in supabase/phase5b-baas.sql, which check instructor
// role/ownership and run each operation in a single transaction.
import { getSupabase } from "@/lib/supabase/client";
import { ApiError, toApiError, unwrap } from "@/lib/supabase/errors";

export async function getMyCourses() {
  const supabase = getSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) throw new ApiError("Not authenticated.", 401);
  const userId = auth.user.id;

  const [coursesResult, pendingResult] = await Promise.all([
    supabase.from("courses").select("id, title, description, category, price, status").eq("owner_id", userId).order("title"),
    supabase.from("course_deletion_requests").select("course_id").eq("requested_by", userId).eq("status", "pending"),
  ]);

  const pendingDeletionCourseIds = new Set(unwrap(pendingResult).map((row) => row.course_id));
  return unwrap(coursesResult).map((course) => ({
    ...course,
    hasPendingDeletionRequest: pendingDeletionCourseIds.has(course.id),
  }));
}

// modules: [{ title, lessons: [{ title, content, durationMinutes, isPreview }] }]
export async function createCourse({ title, description, category, price, modules }) {
  const courseId = unwrap(
    await getSupabase().rpc("create_course", {
      p_title: title,
      p_description: description,
      p_category: category,
      p_price: price,
      p_modules: modules,
    })
  );
  return { courseId };
}

export async function addModule(courseId, { title, lessons }) {
  const moduleId = unwrap(
    await getSupabase().rpc("add_module", { p_course_id: courseId, p_title: title, p_lessons: lessons })
  );
  return { moduleId };
}

export async function addLesson(courseId, moduleId, { title, content, durationMinutes, isPreview = false }) {
  const lessonId = unwrap(
    await getSupabase().rpc("add_lesson", {
      p_course_id: courseId,
      p_module_id: moduleId,
      p_title: title,
      p_content: content,
      p_duration_minutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      p_is_preview: isPreview,
    })
  );
  return { lessonId };
}

// A creator can't delete their own course directly — only request it. An
// admin approving the request is what actually removes it.
export async function requestCourseDeletion(courseId) {
  const { error } = await getSupabase().from("course_deletion_requests").insert({ course_id: courseId });
  if (!error) return { success: true };
  if (error.code === "23505") throw new ApiError("A deletion request is already pending for this course.", 400);
  if (error.code === "42501") throw new ApiError("You don't own this course.", 403);
  throw toApiError(error, "Could not submit deletion request.");
}
