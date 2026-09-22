import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { getUserRoles } from "@/lib/server/roles";

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
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!deletionRequest) {
    return Response.json({ error: "Deletion request not found." }, { status: 404 });
  }
  if (deletionRequest.status !== "pending") {
    return Response.json({ error: "This request has already been reviewed." }, { status: 400 });
  }

  const { error } = await supabase
    .from("course_deletion_requests")
    .update({ status: "declined", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) {
    return Response.json({ error: "Could not decline request." }, { status: 500 });
  }

  return Response.json({ success: true });
}
