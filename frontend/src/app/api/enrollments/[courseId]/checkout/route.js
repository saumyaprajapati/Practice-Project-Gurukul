import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { mapEnrollmentRow } from "@/lib/server/enrollments";

// Used for both a first-time purchase and a renewal — same as the mock
// enrollmentStore's activateEnrollment(). progress_percent is deliberately
// left out of the upsert payload: on conflict, Postgres only overwrites the
// columns listed here, so an existing learner's progress survives a renewal
// and a first-time purchase still gets the column's default of 0.
export async function POST(request, { params }) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { courseId } = await params;
  const supabase = getSupabaseClient();

  const { data: course } = await supabase.from("courses").select("id").eq("id", courseId).maybeSingle();
  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }

  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt);
  expiresAt.setDate(expiresAt.getDate() + 365);

  const { data, error } = await supabase
    .from("enrollments")
    .upsert(
      {
        user_id: session.userId,
        course_id: courseId,
        status: "active",
        purchased_at: purchasedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "user_id,course_id" }
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: "Could not complete purchase." }, { status: 500 });
  }

  return Response.json({ enrollment: mapEnrollmentRow(data) });
}
