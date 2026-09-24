import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ authenticated: false });
  }

  const supabase = getSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", session.userId)
    .maybeSingle();

  if (!user) {
    return Response.json({ authenticated: false });
  }

  return Response.json({ authenticated: true, user });
}
