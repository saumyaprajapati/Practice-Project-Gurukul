import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { canViewUnapprovedCourse } from "@/lib/server/courseAccess";

// Approved courses are public. A pending/declined course is only visible to
// its own owner or an admin — everyone else gets a 404 (not a 403), so the
// route doesn't leak that a not-yet-approved course exists.
export async function GET(request, { params }) {
  const { courseId } = await params;
  const supabase = getSupabaseClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, category, instructor, thumbnail, price, status, owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }

  if (course.status !== "approved" && !(await canViewUnapprovedCourse(course.owner_id))) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }

  const { status, owner_id, ...publicFields } = course;
  return Response.json({ course: publicFields });
}
