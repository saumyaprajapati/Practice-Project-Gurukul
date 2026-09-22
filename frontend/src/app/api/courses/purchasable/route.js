import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { mapEnrollmentRow } from "@/lib/server/enrollments";
import { hasActiveAccess } from "@/lib/courses/enrollment";

// Courses with no active enrollment — never purchased, or previously
// purchased and now expired. Server-side equivalent of the old
// lib/courses/derive.js's getPurchasableCourses(), now joining real rows
// instead of static arrays.
export async function GET() {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const [{ data: courses, error: coursesError }, { data: enrollments, error: enrollmentsError }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, title, description, category, instructor, thumbnail, price")
        .order("title"),
      supabase.from("enrollments").select("*").eq("user_id", session.userId),
    ]);

  if (coursesError || enrollmentsError) {
    return Response.json({ error: "Could not load courses." }, { status: 500 });
  }

  const enrollmentByCourseId = new Map(enrollments.map((row) => [row.course_id, mapEnrollmentRow(row)]));

  const items = courses
    .map((course) => ({ course, enrollment: enrollmentByCourseId.get(course.id) ?? null }))
    .filter(({ enrollment }) => !hasActiveAccess(enrollment));

  return Response.json({ items });
}
