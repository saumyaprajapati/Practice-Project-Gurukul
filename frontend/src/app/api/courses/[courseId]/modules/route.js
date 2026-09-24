import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { validateModule } from "@/lib/server/courseContent";

// Append-only: a creator can add a new module (with its lessons) to their
// own course at any time, but there's no route to edit or remove an
// existing module/lesson — per the plan's append-only content rule.
export async function POST(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId } = await params;
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

  const body = await request.json().catch(() => ({}));
  const moduleError = validateModule(body);
  if (moduleError) {
    return Response.json({ error: moduleError }, { status: 400 });
  }

  const { data: existingModules } = await supabase
    .from("course_modules")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1);

  const modulePosition = (existingModules?.[0]?.position ?? 0) + 1;

  const { data: moduleRow, error: moduleInsertError } = await supabase
    .from("course_modules")
    .insert({ course_id: courseId, title: body.title, position: modulePosition })
    .select("id")
    .single();

  if (moduleInsertError) {
    return Response.json({ error: "Could not save module." }, { status: 500 });
  }

  const lessonRows = body.lessons.map((lesson, lessonIndex) => ({
    module_id: moduleRow.id,
    course_id: courseId,
    lesson_key: `module-${modulePosition}-lesson-${lessonIndex + 1}`,
    title: lesson.title,
    content: lesson.content,
    duration_minutes: Number.isFinite(lesson.durationMinutes) ? lesson.durationMinutes : 10,
    position: lessonIndex + 1,
  }));

  const { error: lessonsError } = await supabase.from("course_lessons").insert(lessonRows);
  if (lessonsError) {
    await supabase.from("course_modules").delete().eq("id", moduleRow.id);
    return Response.json({ error: "Could not save module." }, { status: 500 });
  }

  return Response.json({ moduleId: moduleRow.id });
}
