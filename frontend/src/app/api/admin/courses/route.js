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
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, category, instructor, price, status, owner_id")
    .eq("status", status)
    .order("title");

  if (error) {
    return Response.json({ error: "Could not load courses." }, { status: 500 });
  }

  return Response.json({ courses });
}
