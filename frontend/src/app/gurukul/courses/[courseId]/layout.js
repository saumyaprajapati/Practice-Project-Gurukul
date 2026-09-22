import { cache } from "react";
import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { canViewUnapprovedCourse } from "@/lib/server/courseAccess";

// Server piece of the route: the existence/visibility check + notFound()
// and the per-course <title> both need to stay server-side (notFound() is
// only documented for Server Components; metadata can't come from a Client
// page.js). page.js underneath is a Client Component so it can fetch
// enrollment state for the signed-in learner — this split lets both live
// together in the same route segment. Queries Supabase directly (not a
// self-fetch through /api/courses/[courseId]) since this already runs
// server-side; react's cache() dedupes the identical lookup that both
// generateMetadata and the layout body need within one request.
//
// A pending/declined course is only visible to its own owner or an admin —
// same rule api/courses/[courseId] enforces — so this route 404s for
// everyone else instead of ever rendering page.js with an inaccessible
// course.
const getVisibleCourse = cache(async (courseId) => {
  const supabase = getSupabaseClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, status, owner_id")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) return null;
  if (course.status === "approved") return course;

  return (await canViewUnapprovedCourse(course.owner_id)) ? course : null;
});

export async function generateMetadata({ params }) {
  const { courseId } = await params;
  const course = await getVisibleCourse(courseId);
  return { title: course ? `${course.title} — Gurukul` : "Course — Gurukul" };
}

export default async function CourseDetailLayout({ children, params }) {
  const { courseId } = await params;
  const course = await getVisibleCourse(courseId);
  if (!course) notFound();

  return children;
}
