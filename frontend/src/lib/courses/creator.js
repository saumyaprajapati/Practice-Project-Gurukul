// Instructor-side course operations — creating a course, appending content
// to an existing one of your own, and requesting its deletion. Mirrors the
// one-file-per-concern pattern of courses.js/enrollment.js/progress.js.
import { apiFetch } from "@/lib/apiClient";

export async function getMyCourses() {
  const { courses } = await apiFetch("/api/courses/mine");
  return courses;
}

export async function createCourse({ title, description, category, price, modules }) {
  return apiFetch("/api/courses", { method: "POST", body: { title, description, category, price, modules } });
}

export async function addModule(courseId, { title, lessons }) {
  return apiFetch(`/api/courses/${courseId}/modules`, { method: "POST", body: { title, lessons } });
}

export async function addLesson(courseId, moduleId, { title, content, durationMinutes }) {
  return apiFetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
    method: "POST",
    body: { title, content, durationMinutes },
  });
}

export async function requestCourseDeletion(courseId) {
  return apiFetch(`/api/courses/${courseId}/request-deletion`, { method: "POST" });
}
