// Course repository — queries Supabase directly (Data API + RLS). The
// `courses_select_visible` policy hides pending/declined courses from
// anyone but their owner, admins and enrolled learners. Isolated from the
// landing page's marketing preview data (components/landing/coursesData.js).
import { getSupabase } from "@/lib/supabase/client";
import { toApiError } from "@/lib/supabase/errors";

export const COURSE_FIELDS = "id, title, description, category, instructor, thumbnail, price";

// null = doesn't exist OR RLS hides it — same as the old 404.
// `supabase` defaults to the browser client; the MCP server passes its own.
export async function getCourseById(id, supabase = getSupabase()) {
  const { data, error } = await supabase.from("courses").select(COURSE_FIELDS).eq("id", id).maybeSingle();
  if (error) throw toApiError(error);
  return data;
}

function mapMedia(row) {
  return {
    id: row.id,
    kind: row.kind,
    path: row.storage_path,
    url: row.external_url,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    position: row.position,
  };
}

// Same shape the old /curriculum route returned, plus isPreview/locked and
// media. Lesson text (course_lesson_content) and media (course_lesson_media)
// share one RLS rule: preview lessons, or enrolled learners/the owner/admins.
// A lesson whose content row is missing comes back locked, with no content,
// no video and no files.
export async function getCourseCurriculum(courseId, supabase = getSupabase()) {
  const { data, error } = await supabase
    .from("course_modules")
    .select(
      "id, title, position, course_lessons(id, lesson_key, title, duration_minutes, position, is_preview, course_lesson_content(content), course_lesson_media(id, kind, storage_path, external_url, file_name, mime_type, size_bytes, position))"
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
        const media = [...(lesson.course_lesson_media ?? [])].sort((a, b) => a.position - b.position).map(mapMedia);
        return {
          id: lesson.lesson_key,
          title: lesson.title,
          durationMinutes: lesson.duration_minutes,
          isPreview: lesson.is_preview,
          locked: !contentRow,
          content: contentRow ? contentRow.content.split(/\n\s*\n/).map((paragraph) => paragraph.trim()) : [],
          video: media.find((item) => item.kind === "video" || item.kind === "video_link") ?? null,
          files: media.filter((item) => item.kind === "file"),
        };
      }),
  }));

  return { courseId, modules };
}
