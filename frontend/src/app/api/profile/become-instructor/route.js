import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";

// One-way opt-in — no "become a learner again" flow, matching the plan's
// append-only-by-design philosophy for this feature.
export async function POST() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("users")
    .update({ is_instructor: true, updated_at: new Date().toISOString() })
    .eq("id", session.userId);

  if (error) {
    return Response.json({ error: "Could not update profile." }, { status: 500 });
  }

  return Response.json({ success: true });
}
