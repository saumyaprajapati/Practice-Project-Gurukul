// Lesson-progress repository — talks to the real /api/enrollments/[courseId]/progress
// routes, scoped server-side to the authenticated user. Mirrors the
// one-file-per-resource pattern of courses.js/enrollment.js.
import { apiFetch } from "@/lib/apiClient";

export async function getLessonProgress(courseId) {
  const { completedLessonIds } = await apiFetch(`/api/enrollments/${courseId}/progress`);
  return completedLessonIds;
}

export async function markLessonComplete(courseId, lessonId) {
  return apiFetch(`/api/enrollments/${courseId}/progress`, {
    method: "POST",
    body: { lessonId },
  });
}
