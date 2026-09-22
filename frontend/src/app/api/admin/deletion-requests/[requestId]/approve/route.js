import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { getUserRoles } from "@/lib/server/roles";

// Approving a deletion request actually deletes the course — cascades its
// modules/lessons/enrollments/lesson_progress for every learner who had it
// (not just the creator's own data) and the deletion_requests row itself,
// all via "on delete cascade" foreign keys back to courses.id.
export async function POST(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { isAdmin } = await getUserRoles(session.userId);
  if (!isAdmin) {
    return Response.json({ error: "Admins only." }, { status: 403 });
  }

  const { requestId } = await params;
  const supabase = getSupabaseClient();

  const { data: deletionRequest } = await supabase
    .from("course_deletion_requests")
    .select("id, course_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!deletionRequest) {
    return Response.json({ error: "Deletion request not found." }, { status: 404 });
  }
  if (deletionRequest.status !== "pending") {
    return Response.json({ error: "This request has already been reviewed." }, { status: 400 });
  }

  const { error } = await supabase.from("courses").delete().eq("id", deletionRequest.course_id);
  if (error) {
    return Response.json({ error: "Could not delete the course." }, { status: 500 });
  }

  return Response.json({ success: true });
}
