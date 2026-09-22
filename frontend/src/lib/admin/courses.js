// Admin review-queue operations — course approval and deletion requests.
import { apiFetch } from "@/lib/apiClient";

export async function getPendingCourses() {
  const { courses } = await apiFetch("/api/admin/courses?status=pending");
  return courses;
}

export async function approveCourse(courseId) {
  return apiFetch(`/api/admin/courses/${courseId}/approve`, { method: "POST" });
}

export async function declineCourse(courseId) {
  return apiFetch(`/api/admin/courses/${courseId}/decline`, { method: "POST" });
}

export async function getPendingDeletionRequests() {
  const { requests } = await apiFetch("/api/admin/deletion-requests?status=pending");
  return requests;
}

export async function approveDeletionRequest(requestId) {
  return apiFetch(`/api/admin/deletion-requests/${requestId}/approve`, { method: "POST" });
}

export async function declineDeletionRequest(requestId) {
  return apiFetch(`/api/admin/deletion-requests/${requestId}/decline`, { method: "POST" });
}
