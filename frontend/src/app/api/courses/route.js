import { getAuthenticatedUser } from "@/lib/server/auth";
import { getSupabaseClient } from "@/lib/server/supabaseClient";
import { getUserRoles } from "@/lib/server/roles";
import { validateModules } from "@/lib/server/courseContent";

export async function GET() {
  const supabase = getSupabaseClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, category, instructor, thumbnail, price")
    .eq("status", "approved")
    .order("title");

  if (error) {
    return Response.json({ error: "Could not load courses." }, { status: 500 });
  }

  return Response.json({ courses });
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueCourseId(supabase, title) {
  const base = slugify(title) || "course";
  let candidate = base;
  let suffix = 2;
  // Prototype-scoped: a small retry loop is fine at this catalogue size.
  while (true) {
    const { data } = await supabase.from("courses").select("id").eq("id", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

// Creates the course (status: "pending" until an admin reviews it) plus its
// initial modules/lessons, and grants the creator instant active access to
// their own course regardless of approval status. No transactions available
// via supabase-js, so on any failure partway through we best-effort delete
// the course we started (cascades any modules/lessons already inserted).
export async function POST(request) {
  const session = await getAuthenticatedUser();
  if (!session) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { isInstructor } = await getUserRoles(session.userId);
  if (!isInstructor) {
    return Response.json({ error: "Only instructors can create courses." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { title, description, category, price, modules } = body;

  if (!title?.trim() || !description?.trim() || !category?.trim()) {
    return Response.json({ error: "Title, description, and category are required." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return Response.json({ error: "Price must be a non-negative number." }, { status: 400 });
  }
  const modulesError = validateModules(modules);
  if (modulesError) {
    return Response.json({ error: modulesError }, { status: 400 });
  }

  const { data: owner } = await supabase.from("users").select("name").eq("id", session.userId).maybeSingle();
  const courseId = await generateUniqueCourseId(supabase, title);

  const { error: courseError } = await supabase.from("courses").insert({
    id: courseId,
    title,
    description,
    category,
    instructor: owner?.name ?? "Unknown Instructor",
    price,
    owner_id: session.userId,
    status: "pending",
  });

  if (courseError) {
    return Response.json({ error: "Could not create course." }, { status: 500 });
  }

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const moduleInput = modules[moduleIndex];
    const modulePosition = moduleIndex + 1;

    const { data: moduleRow, error: moduleError } = await supabase
      .from("course_modules")
      .insert({ course_id: courseId, title: moduleInput.title, position: modulePosition })
      .select("id")
      .single();

    if (moduleError) {
      await supabase.from("courses").delete().eq("id", courseId);
      return Response.json({ error: "Could not save course content." }, { status: 500 });
    }

    const lessonRows = moduleInput.lessons.map((lesson, lessonIndex) => ({
      module_id: moduleRow.id,
      course_id: courseId,
      lesson_key: `module-${modulePosition}-lesson-${lessonIndex + 1}`,
      title: lesson.title,
      content: lesson.content,
      duration_minutes: Number.isFinite(lesson.durationMinutes) ? lesson.durationMinutes : 10,
      position: lessonIndex + 1,
    }));

    const { error: lessonsError } = await supabase.from("course_lessons").insert(lessonRows);
    if (lessonsError) {
      await supabase.from("courses").delete().eq("id", courseId);
      return Response.json({ error: "Could not save course content." }, { status: 500 });
    }
  }

  const purchasedAt = new Date();
  const expiresAt = new Date(purchasedAt);
  expiresAt.setDate(expiresAt.getDate() + 365);

  await supabase.from("enrollments").insert({
    user_id: session.userId,
    course_id: courseId,
    status: "active",
    purchased_at: purchasedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  return Response.json({ courseId });
}
