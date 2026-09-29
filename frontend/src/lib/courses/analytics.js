// Instructor course analytics — reads go through the owner-checked RPCs in
// supabase/phase8-course-analytics.sql (instructors can't read their
// learners' rows directly). The course owner is left out of every number.
import { getSupabase } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/errors";

export async function getCourseAnalytics(courseId) {
  return unwrap(await getSupabase().rpc("course_analytics", { p_course_id: courseId }));
}

export async function getCourseStudents(courseId) {
  const rows = unwrap(await getSupabase().rpc("course_students", { p_course_id: courseId }));
  return rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    enrolledAt: row.enrolled_at,
    status: row.status,
    expiresAt: row.expires_at,
    progressPercent: row.progress_percent,
    completedLessons: Number(row.completed_lessons),
    currentLessonTitle: row.current_lesson_title,
    lastActiveAt: row.last_active_at,
  }));
}

// "Watching now" heartbeat, sent while a lesson page is open and visible.
export async function touchLessonActivity(courseId, lessonKey) {
  unwrap(await getSupabase().rpc("touch_lesson_activity", { p_course_id: courseId, p_lesson_key: lessonKey }));
}
