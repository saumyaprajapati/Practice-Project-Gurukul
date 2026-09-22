import { getSupabaseClient } from "@/lib/server/supabaseClient";

export async function GET(request, { params }) {
  const { courseId } = await params;
  const supabase = getSupabaseClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, category, instructor, thumbnail, price")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }

  return Response.json({ course });
}
