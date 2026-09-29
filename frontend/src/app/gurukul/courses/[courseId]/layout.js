import { cache } from "react";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

// Server piece of the route: the existence/visibility check + notFound()
// and the per-course <title> both need to stay server-side (notFound() is
// only documented for Server Components; metadata can't come from a Client
// page.js). page.js underneath is a Client Component so it can fetch
// enrollment state for the signed-in learner — this split lets both live
// together in the same route segment. react's cache() dedupes the identical
// lookup that both generateMetadata and the layout body need within one
// request.
//
// Queries as the signed-in user (publishable key + session cookie), so the
// courses_select_visible RLS policy hides a pending/declined course from
// anyone but its owner, admins and enrolled learners — the query returns no
// row and this route 404s instead of ever rendering page.js.
const getVisibleCourse = cache(async (courseId) => {
  const supabase = await getServerSupabase();
  const { data: course } = await supabase.from("courses").select("id, title").eq("id", courseId).maybeSingle();
  return course;
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
