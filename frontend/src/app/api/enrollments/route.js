import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { mapEnrollmentRow } from "@/lib/server/enrollments";

export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("enrollments").select("*").eq("user_id", session.userId);

  if (error) {
    return Response.json({ error: "Could not load enrollments." }, { status: 500 });
  }

  return Response.json({ enrollments: data.map(mapEnrollmentRow) });
}
