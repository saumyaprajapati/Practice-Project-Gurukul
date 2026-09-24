import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";

// A creator can't delete their own course directly — only request it. An
// admin approving the request is what actually removes it (see
// api/admin/deletion-requests/[requestId]/approve).
export async function POST(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId } = await params;
  const supabase = getSupabaseClient();

  const { data: course } = await supabase
    .from("courses")
    .select("owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }
  if (course.owner_id !== session.userId) {
    return Response.json({ error: "You don't own this course." }, { status: 403 });
  }

  const { data: existingRequest } = await supabase
    .from("course_deletion_requests")
    .select("id")
    .eq("course_id", courseId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingRequest) {
    return Response.json({ error: "A deletion request is already pending for this course." }, { status: 400 });
  }

  const { error } = await supabase
    .from("course_deletion_requests")
    .insert({ course_id: courseId, requested_by: session.userId });

  if (error) {
    return Response.json({ error: "Could not submit deletion request." }, { status: 500 });
  }

  return Response.json({ success: true });
}
