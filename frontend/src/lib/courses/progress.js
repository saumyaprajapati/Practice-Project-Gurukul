// Lesson-progress repository — lesson_progress rows are read/inserted
// directly; RLS only allows inserting your own row, for a real lesson, with
// an active enrollment. The lesson_progress_recalc trigger recomputes
// enrollments.progress_percent after each insert.
import { getSupabase } from "@/lib/supabase/client";
import { ApiError, toApiError, unwrap } from "@/lib/supabase/errors";

export async function getLessonProgress(courseId) {
  const rows = unwrap(await getSupabase().from("lesson_progress").select("lesson_id").eq("course_id", courseId));
  return rows.map((row) => row.lesson_id);
}

export async function markLessonComplete(courseId, lessonId) {
  const supabase = getSupabase();
  const { error } = await supabase.from("lesson_progress").insert({ course_id: courseId, lesson_id: lessonId });
  // 23505 = already completed, which is fine.
  if (error && error.code !== "23505") {
    if (error.code === "42501") throw new ApiError("No active enrollment for this course.", 403);
    throw toApiError(error);
  }

  const [progressResult, enrollmentResult] = await Promise.all([
    supabase.from("lesson_progress").select("lesson_id").eq("course_id", courseId),
    supabase.from("enrollments").select("progress_percent").eq("course_id", courseId).maybeSingle(),
  ]);

  return {
    completedLessonIds: unwrap(progressResult).map((row) => row.lesson_id),
    percent: unwrap(enrollmentResult)?.progress_percent ?? 0,
  };
}
