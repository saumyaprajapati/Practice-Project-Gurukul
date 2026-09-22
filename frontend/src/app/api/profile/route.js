import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !user) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }

  return Response.json({ user });
}
