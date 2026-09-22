import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { mapEnrollmentRow } from "@/lib/server/enrollments";

// Returns { enrollment: null } (not a 404) when the caller has never
// purchased this course — that's an expected state, not an error.
export async function GET(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId } = await params;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", session.userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Could not load enrollment." }, { status: 500 });
  }

  return Response.json({ enrollment: mapEnrollmentRow(data) });
}
