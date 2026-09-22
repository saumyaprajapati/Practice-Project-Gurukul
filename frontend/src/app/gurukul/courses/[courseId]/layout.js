import { notFound } from "next/navigation";
import { getCourseById } from "@/lib/courses/courses";

// Server piece of the route: the existence check + notFound() and the
// per-course <title> both need to stay server-side (notFound() is only
// documented for Server Components; metadata can't come from a Client
// page.js). page.js underneath is a Client Component so it can read
// localStorage-backed enrollment overrides — this split lets both live
// together in the same route segment.
export async function generateMetadata({ params }) {
  const { courseId } = await params;
  const course = getCourseById(courseId);
  return { title: course ? `${course.title} — Gurukul` : "Course — Gurukul" };
}

export default async function CourseDetailLayout({ children, params }) {
  const { courseId } = await params;
  if (!getCourseById(courseId)) notFound();

  return children;
}
