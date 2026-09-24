import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { canViewUnapprovedCourse } from "@/lib/server/courseAccess";

// Same visibility rule as api/courses/[courseId]. Lesson content is stored
// as raw multi-paragraph text (blank-line separated) and split into an
// array here, matching the exact shape LessonPanel/flattenLessons already
// expect from the old generated curriculum.
export async function GET(request, { params }) {
  const { courseId } = await params;
  const supabase = getSupabaseClient();

  const { data: course } = await supabase
    .from("courses")
    .select("status, owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }
  if (course.status !== "approved" && !(await canViewUnapprovedCourse(course.owner_id))) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }

  const { data: modules, error: modulesError } = await supabase
    .from("course_modules")
    .select("id, title, position, course_lessons(id, lesson_key, title, content, duration_minutes, position)")
    .eq("course_id", courseId)
    .order("position");

  if (modulesError) {
    return Response.json({ error: "Could not load curriculum." }, { status: 500 });
  }

  const shaped = modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: [...module.course_lessons]
      .sort((a, b) => a.position - b.position)
      .map((lesson) => ({
        id: lesson.lesson_key,
        title: lesson.title,
        durationMinutes: lesson.duration_minutes,
        content: lesson.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()),
      })),
  }));

  return Response.json({ courseId, modules: shaped });
}
