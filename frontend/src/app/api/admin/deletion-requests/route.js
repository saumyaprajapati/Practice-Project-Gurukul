import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { getUserRoles } from "@/lib/server/roles";

const VALID_STATUSES = ["pending", "approved", "declined"];

export async function GET(request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { isAdmin } = await getUserRoles(session.userId);
  if (!isAdmin) {
    return Response.json({ error: "Admins only." }, { status: 403 });
  }

  const statusParam = new URL(request.url).searchParams.get("status") ?? "pending";
  const status = VALID_STATUSES.includes(statusParam) ? statusParam : "pending";

  const supabase = getSupabaseClient();
  const { data: requests, error } = await supabase
    .from("course_deletion_requests")
    .select("id, course_id, requested_by, status, requested_at, courses(title)")
    .eq("status", status)
    .order("requested_at");

  if (error) {
    return Response.json({ error: "Could not load deletion requests." }, { status: 500 });
  }

  const shaped = requests.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.courses?.title ?? row.course_id,
    requestedBy: row.requested_by,
    status: row.status,
    requestedAt: row.requested_at,
  }));

  return Response.json({ requests: shaped });
}
