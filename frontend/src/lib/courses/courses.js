// Course repository — talks to the real /api/courses routes (backed by the
// Supabase `courses` table, seeded from supabase/phase2-courses-schema.sql).
// Isolated from the landing page's marketing preview data
// (components/landing/coursesData.js), same as before.
import { apiFetch, ApiError } from "@/lib/apiClient";

export async function getAllCourses() {
  const { courses } = await apiFetch("/api/courses");
  return courses;
}

export async function getCourseById(id) {
  try {
    const { course } = await apiFetch(`/api/courses/${id}`);
    return course;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// Real authored curriculum (course_modules/course_lessons), replacing the
// old client-side generator (lib/courses/curriculum.js used to build this
// on the fly from just the course object).
export async function getCourseCurriculum(courseId) {
  const { courseId: id, modules } = await apiFetch(`/api/courses/${courseId}/curriculum`);
  return { courseId: id, modules };
}
