import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";

// The caller's own authored courses at any status — their creator
// dashboard, distinct from api/courses/purchasable and .../my-learning
// which are both enrollment-based, not ownership-based.
export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const [{ data: courses, error }, { data: pendingRequests }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, category, price, status")
      .eq("owner_id", session.userId)
      .order("title"),
    supabase.from("course_deletion_requests").select("course_id").eq("requested_by", session.userId).eq("status", "pending"),
  ]);

  if (error) {
    return Response.json({ error: "Could not load courses." }, { status: 500 });
  }

  const pendingDeletionCourseIds = new Set((pendingRequests ?? []).map((row) => row.course_id));
  const shaped = courses.map((course) => ({
    ...course,
    hasPendingDeletionRequest: pendingDeletionCourseIds.has(course.id),
  }));

  return Response.json({ courses: shaped });
}
