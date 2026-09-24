import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { validateLesson } from "@/lib/server/courseContent";

// Append-only: adds a lesson to one of the caller's own existing modules.
// No edit/delete route for existing lessons — same rule as .../modules.
export async function POST(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId, moduleId } = await params;
  const supabase = getSupabaseClient();

  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }
  if (course.owner_id !== session.userId) {
    return Response.json({ error: "You don't own this course." }, { status: 403 });
  }

  const { data: moduleRow } = await supabase
    .from("course_modules")
    .select("id, position")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!moduleRow) {
    return Response.json({ error: "Module not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const lessonError = validateLesson(body);
  if (lessonError) {
    return Response.json({ error: lessonError }, { status: 400 });
  }

  const { data: existingLessons } = await supabase
    .from("course_lessons")
    .select("position")
    .eq("module_id", moduleId)
    .order("position", { ascending: false })
    .limit(1);

  const lessonPosition = (existingLessons?.[0]?.position ?? 0) + 1;

  const { data: lessonRow, error: lessonError2 } = await supabase
    .from("course_lessons")
    .insert({
      module_id: moduleId,
      course_id: courseId,
      lesson_key: `module-${moduleRow.position}-lesson-${lessonPosition}`,
      title: body.title,
      content: body.content,
      duration_minutes: Number.isFinite(body.durationMinutes) ? body.durationMinutes : 10,
      position: lessonPosition,
    })
    .select("id")
    .single();

  if (lessonError2) {
    return Response.json({ error: "Could not save lesson." }, { status: 500 });
  }

  return Response.json({ lessonId: lessonRow.id });
}
