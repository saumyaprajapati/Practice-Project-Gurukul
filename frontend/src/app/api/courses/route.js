import { getSupabaseClient } from "@/lib/server/supabaseClient";

export async function GET() {
  const supabase = getSupabaseClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, category, instructor, thumbnail, price")
    .order("title");

  if (error) {
    return Response.json({ error: "Could not load courses." }, { status: 500 });
  }

  return Response.json({ courses });
}
