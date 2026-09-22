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

  const { courseId } = await params;
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("courses").update({ status: "approved" }).eq("id", courseId);

  if (error) {
    return Response.json({ error: "Could not approve course." }, { status: 500 });
  }

  return Response.json({ success: true });
}
