// Course repository — queries Supabase directly (Data API + RLS). The
// `courses_select_visible` policy hides pending/declined courses from
// anyone but their owner, admins and enrolled learners. Isolated from the
// landing page's marketing preview data (components/landing/coursesData.js).
import { getSupabase } from "@/lib/supabase/client";
import { toApiError } from "@/lib/supabase/errors";

export const COURSE_FIELDS = "id, title, description, category, instructor, thumbnail, price";

// null = doesn't exist OR RLS hides it — same as the old 404.
export async function getCourseById(id) {
  const { data, error } = await getSupabase().from("courses").select(COURSE_FIELDS).eq("id", id).maybeSingle();
  if (error) throw toApiError(error);
  return data;
}

// Same shape the old /curriculum route returned, plus isPreview/locked.
// Lesson text lives in course_lesson_content, which RLS only returns for
// preview lessons or to enrolled learners/the owner/admins — a lesson whose
// content row is missing comes back locked with no content.
export async function getCourseCurriculum(courseId) {
  const { data, error } = await getSupabase()
    .from("course_modules")
    .select(
      "id, title, position, course_lessons(id, lesson_key, title, duration_minutes, position, is_preview, course_lesson_content(content))"
    )
    .eq("course_id", courseId)
    .order("position");
  if (error) throw toApiError(error);

  const modules = data.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: [...module.course_lessons]
      .sort((a, b) => a.position - b.position)
      .map((lesson) => {
        const contentRow = Array.isArray(lesson.course_lesson_content)
          ? lesson.course_lesson_content[0]
          : lesson.course_lesson_content;
        return {
          id: lesson.lesson_key,
          title: lesson.title,
          durationMinutes: lesson.duration_minutes,
          isPreview: lesson.is_preview,
          locked: !contentRow,
          content: contentRow ? contentRow.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()) : [],
        };
      }),
  }));

  return { courseId, modules };
}
