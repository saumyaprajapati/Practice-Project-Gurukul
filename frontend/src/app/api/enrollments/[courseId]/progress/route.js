import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { mapEnrollmentRow } from "@/lib/server/enrollments";
import { hasActiveAccess } from "@/lib/courses/enrollment";
import { getTotalLessonCount } from "@/lib/courses/curriculum";

export async function GET(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId } = await params;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", session.userId)
    .eq("course_id", courseId);

  if (error) {
    return Response.json({ error: "Could not load progress." }, { status: 500 });
  }

  return Response.json({ completedLessonIds: data.map((row) => row.lesson_id) });
}

// Marks a lesson complete and recomputes the enrollment's cached
// progress_percent from the real completed-lesson count — the same value
// My Learning's progress bar and getCourseState() read.
export async function POST(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId } = await params;
  const body = await request.json().catch(() => ({}));
  const { lessonId } = body;
  if (!lessonId) {
    return Response.json({ error: "lessonId is required." }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const { data: enrollmentRow } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", session.userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!hasActiveAccess(mapEnrollmentRow(enrollmentRow))) {
    return Response.json({ error: "No active enrollment for this course." }, { status: 403 });
  }

  await supabase
    .from("lesson_progress")
    .upsert(
      { user_id: session.userId, course_id: courseId, lesson_id: lessonId },
      { onConflict: "user_id,course_id,lesson_id", ignoreDuplicates: true }
    );

  const { data: rows, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", session.userId)
    .eq("course_id", courseId);

  if (error) {
    return Response.json({ error: "Could not save progress." }, { status: 500 });
  }

  const completedLessonIds = rows.map((row) => row.lesson_id);
  const totalCount = getTotalLessonCount();
  const percent = totalCount === 0 ? 0 : Math.round((completedLessonIds.length / totalCount) * 100);

  await supabase
    .from("enrollments")
    .update({ progress_percent: percent })
    .eq("user_id", session.userId)
    .eq("course_id", courseId);

  return Response.json({ completedLessonIds, percent });
}
