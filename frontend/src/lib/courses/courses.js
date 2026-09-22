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
