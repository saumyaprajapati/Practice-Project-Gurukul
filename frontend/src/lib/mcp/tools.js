import "server-only";
import { z } from "zod";
import { supabaseForToken } from "@/lib/mcp/supabase";
import { getCourseById, getCourseCurriculum } from "@/lib/courses/courses";
import { flattenLessons } from "@/lib/courses/curriculum";
import { getCourseState, hasActiveAccess, mapEnrollmentRow } from "@/lib/courses/enrollment";
import { formatPrice } from "@/lib/courses/currency";
import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";
import { toApiError, unwrap } from "@/lib/supabase/errors";

// Tools, prompt and instructions of the Gurukul MCP server (src/app/api/mcp).
// Every call runs as the user who approved the agent, so RLS and the RPCs'
// own checks apply exactly as in the app.

export const SERVER_INSTRUCTIONS = `Gurukul is an online learning platform. Use these tools for the signed-in learner:
- New term or technology while working? search_courses finds the Gurukul course that teaches it; get_course shows its outline.
- list_my_courses shows what they are enrolled in and how far they got.
- To refresh something they learned, call recap_topic and summarise the returned lesson text briefly, citing the course and lesson. Don't invent material that isn't in the lessons.
- enroll_in_course enrols them in a course. Always ask the user and wait for a clear yes before calling it.`;

const courseId = z.string().trim().min(1).describe("Course id, e.g. \"react-in-depth\" (from search_courses or list_my_courses)");

function session(ctx) {
  const auth = ctx.http?.authInfo;
  if (!auth?.extra?.userId) throw new Error("Not signed in. Reconnect the Gurukul MCP server to log in.");
  const origin = auth.extra.origin ?? "";
  return {
    db: supabaseForToken(auth.token),
    userId: auth.extra.userId,
    email: auth.extra.email,
    link: (path) => `${origin}${path}`,
  };
}

function reply(text, structuredContent) {
  return { content: [{ type: "text", text }], structuredContent };
}

// Runs a tool body, turning Supabase/RPC errors into a readable tool error.
function tool(run) {
  return async (args, ctx) => {
    try {
      return await run(args ?? {}, session(ctx));
    } catch (error) {
      return { content: [{ type: "text", text: error.message || "Something went wrong." }], isError: true };
    }
  };
}

async function getOwnEnrollment(db, userId, id) {
  const { data, error } = await db.from("enrollments").select("*").eq("user_id", userId).eq("course_id", id).maybeSingle();
  if (error) throw toApiError(error);
  return mapEnrollmentRow(data);
}

function describeEnrollment(enrollment) {
  if (!enrollment) return "not enrolled";
  if (!hasActiveAccess(enrollment)) return `access expired on ${enrollment.expiresAt.slice(0, 10)}`;
  return `enrolled, ${enrollment.progress}% complete, access until ${enrollment.expiresAt.slice(0, 10)}`;
}

export function registerTools(server) {
  server.registerTool(
    "whoami",
    {
      title: "Who am I",
      description: "The Gurukul account this agent is connected as: name, email and role.",
      inputSchema: z.object({}), // keeps the (args, ctx) callback signature every tool() expects
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    tool(async (_args, { db, userId, email }) => {
      const profile = unwrap(
        await db.from("profiles").select("name, is_instructor, is_admin").eq("id", userId).maybeSingle()
      );
      const me = {
        userId,
        name: profile?.name ?? null,
        email,
        isInstructor: Boolean(profile?.is_instructor),
        isAdmin: Boolean(profile?.is_admin),
      };
      const role = me.isAdmin ? "admin" : me.isInstructor ? "instructor" : "learner";
      return reply(`Signed in to Gurukul as ${me.name ?? "Learner"} <${email}> (${role}).`, me);
    })
  );

  server.registerTool(
    "search_courses",
    {
      title: "Search courses",
      description:
        "Find Gurukul courses that teach a technology, tool or concept (e.g. \"docker volumes\", \"JWT\", \"SQL joins\"). Returns the best matches, which lessons matched, the price and whether the user is already enrolled.",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(200).describe("The term or technology to look for"),
        limit: z.number().int().min(1).max(25).optional().describe("Max results (default 10)"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    tool(async ({ query, limit }, { db, link }) => {
      const rows = unwrap(await db.rpc("search_courses", { p_query: query, p_limit: limit ?? 10 }));
      const courses = rows.map((row) => ({
        courseId: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        instructor: row.instructor,
        price: formatPrice(row.price),
        isEnrolled: row.is_enrolled,
        matchedLessons: row.matched_lessons ?? [],
        url: link(GURUKUL_ROUTES.courseDetail(row.id)),
      }));
      if (courses.length === 0) {
        return reply(`No Gurukul course matches "${query}". Try a broader or different term.`, { courses });
      }
      const lines = courses.map(
        (c, i) =>
          `${i + 1}. ${c.title} (id: ${c.courseId}) — ${c.category}, by ${c.instructor}, ${c.price}` +
          `${c.isEnrolled ? " — already enrolled" : ""}\n   ${c.description}` +
          (c.matchedLessons.length ? `\n   Matching lessons: ${c.matchedLessons.join("; ")}` : "") +
          `\n   ${c.url}`
      );
      return reply(`Courses for "${query}":\n\n${lines.join("\n")}`, { courses });
    })
  );

  server.registerTool(
    "get_course",
    {
      title: "Course details",
      description: "A course's description, price, module and lesson outline, and the user's enrolment status.",
      inputSchema: z.object({ courseId }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    tool(async ({ courseId: id }, { db, userId, link }) => {
      const course = await getCourseById(id, db);
      if (!course) throw new Error(`Course "${id}" not found.`);
      const [curriculum, enrollment] = await Promise.all([getCourseCurriculum(id, db), getOwnEnrollment(db, userId, id)]);

      const modules = curriculum.modules.map((module) => ({
        title: module.title,
        lessons: module.lessons.map((lesson) => ({
          lessonId: lesson.id,
          title: lesson.title,
          durationMinutes: lesson.durationMinutes,
          isPreview: lesson.isPreview,
          locked: lesson.locked,
        })),
      }));
      const lessonCount = modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const result = {
        courseId: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        instructor: course.instructor,
        price: formatPrice(course.price),
        enrollment: enrollment
          ? { active: hasActiveAccess(enrollment), progress: enrollment.progress, expiresAt: enrollment.expiresAt }
          : null,
        lessonCount,
        modules,
        url: link(GURUKUL_ROUTES.courseDetail(course.id)),
      };
      const outline = modules
        .map(
          (module, i) =>
            `${i + 1}. ${module.title}\n` +
            module.lessons
              .map((lesson) => `   - ${lesson.title} (${lesson.durationMinutes} min${lesson.isPreview ? ", free preview" : ""})`)
              .join("\n")
        )
        .join("\n");
      return reply(
        `${course.title} — ${course.category}, by ${course.instructor}, ${result.price}\n${course.description}\n` +
          `You: ${describeEnrollment(enrollment)}\n${lessonCount} lessons:\n${outline}\n${result.url}`,
        result
      );
    })
  );

  server.registerTool(
    "list_my_courses",
    {
      title: "My courses",
      description: "The courses the user is enrolled in, with progress, completed lessons and access expiry.",
      inputSchema: z.object({
        filter: z
          .enum(["active", "completed", "expired", "all"])
          .optional()
          .describe("active (default): courses they can open now; completed: finished ones; expired; all"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    tool(async ({ filter = "active" }, { db, userId, link }) => {
      const [enrollmentRows, progressRows] = await Promise.all([
        db
          .from("enrollments")
          .select("*, courses(title, category, instructor)")
          .eq("user_id", userId)
          .order("purchased_at", { ascending: false }),
        db.from("lesson_progress").select("course_id").eq("user_id", userId),
      ]).then((results) => results.map(unwrap));

      const completedByCourse = new Map();
      progressRows.forEach(({ course_id }) => completedByCourse.set(course_id, (completedByCourse.get(course_id) ?? 0) + 1));

      const courses = enrollmentRows
        .map((row) => {
          const enrollment = mapEnrollmentRow(row);
          return {
            courseId: row.course_id,
            title: row.courses?.title ?? row.course_id,
            category: row.courses?.category ?? "",
            instructor: row.courses?.instructor ?? "",
            active: hasActiveAccess(enrollment),
            state: getCourseState(enrollment),
            progress: enrollment.progress,
            completedLessons: completedByCourse.get(row.course_id) ?? 0,
            enrolledAt: enrollment.purchasedAt,
            expiresAt: enrollment.expiresAt,
            url: link(GURUKUL_ROUTES.courseDetail(row.course_id)),
          };
        })
        .filter((c) =>
          filter === "all" ? true : filter === "expired" ? !c.active : filter === "completed" ? c.state === "completed" : c.active
        );

      if (courses.length === 0) {
        return reply(
          `No ${filter === "all" ? "" : `${filter} `}courses yet. Use search_courses to find one.`,
          { courses }
        );
      }
      const lines = courses.map(
        (c) =>
          `- ${c.title} (id: ${c.courseId}) — ${c.progress}% (${c.completedLessons} lessons done), ` +
          `${c.active ? `access until ${c.expiresAt.slice(0, 10)}` : `expired ${c.expiresAt.slice(0, 10)}`}\n  ${c.url}`
      );
      return reply(`Your ${filter === "all" ? "" : `${filter} `}courses:\n${lines.join("\n")}`, { courses });
    })
  );

  server.registerTool(
    "recap_topic",
    {
      title: "Brush up on a topic",
      description:
        "Finds the lessons in the user's own courses that cover a topic and returns their text, so you can write a short refresher. Only courses the user currently has access to are searched.",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(200).describe("What they want to brush up on, e.g. \"git rebase vs merge\""),
        courseId: courseId.optional().describe("Only search this course"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    tool(async ({ query, courseId: id }, { db, link }) => {
      const rows = unwrap(
        await db.rpc("search_my_lessons", { p_query: query, p_course_id: id ?? null, p_limit: 5 })
      );
      const lessons = rows.map((row) => ({
        courseId: row.course_id,
        courseTitle: row.course_title,
        moduleTitle: row.module_title,
        lessonId: row.lesson_key,
        lessonTitle: row.lesson_title,
        completed: row.completed,
        snippet: row.snippet,
        content: row.content,
        url: link(GURUKUL_ROUTES.courseDetail(row.course_id)),
      }));

      if (lessons.length === 0) {
        return reply(
          `None of your current courses cover "${query}"${id ? ` in ${id}` : ""}. ` +
            "Call search_courses to find a course that teaches it (the user may need to enrol, or renew an expired course).",
          { lessons }
        );
      }
      const blocks = lessons.map(
        (l, i) =>
          `### ${i + 1}. ${l.lessonTitle}\nCourse: ${l.courseTitle} › ${l.moduleTitle} (lesson id: ${l.lessonId}${l.completed ? ", completed" : ""})\n${l.url}\n\n${l.content}`
      );
      return reply(
        `Lessons from the user's courses about "${query}". Write a short refresher from this text only, and name the lesson(s) it came from.\n\n${blocks.join("\n\n")}`,
        { lessons }
      );
    })
  );

  server.registerTool(
    "get_lesson",
    {
      title: "Read a lesson",
      description: "The full text of one lesson, plus its attached files. Locked unless the user is enrolled or it's a free preview.",
      inputSchema: z.object({
        courseId,
        lessonId: z.string().trim().min(1).describe("Lesson id from get_course or recap_topic"),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    tool(async ({ courseId: id, lessonId }, { db, link }) => {
      const lesson = flattenLessons(await getCourseCurriculum(id, db)).find((item) => item.lessonId === lessonId);
      if (!lesson) throw new Error(`Lesson "${lessonId}" not found in course "${id}".`);
      const url = link(GURUKUL_ROUTES.courseDetail(id));
      const result = {
        courseId: id,
        moduleTitle: lesson.moduleTitle,
        lessonId,
        lessonTitle: lesson.lessonTitle,
        durationMinutes: lesson.durationMinutes,
        locked: lesson.locked,
        content: lesson.content.join("\n\n"),
        hasVideo: Boolean(lesson.video),
        files: lesson.files.map((file) => file.fileName),
        url,
      };
      if (lesson.locked) {
        return reply(`"${lesson.lessonTitle}" is locked. Enrol in the course to read it (enroll_in_course, after asking the user).`, result);
      }
      const extras = [result.hasVideo && "a video", result.files.length && `files: ${result.files.join(", ")}`].filter(Boolean);
      return reply(
        `${lesson.lessonTitle} (${lesson.moduleTitle})\n\n${result.content}` +
          (extras.length ? `\n\nAlso in the app: ${extras.join("; ")} — ${url}` : ""),
        result
      );
    })
  );

  server.registerTool(
    "enroll_in_course",
    {
      title: "Enrol in a course",
      description:
        "Enrols the user in a course for 365 days (mock checkout: no payment is taken). Ask the user and wait for a clear yes before calling. If they already have active access nothing changes unless renew is true.",
      inputSchema: z.object({
        courseId,
        renew: z.boolean().optional().describe("Restart the 365 days even if access is still active"),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    tool(async ({ courseId: id, renew = false }, { db, userId, link }) => {
      const course = await getCourseById(id, db);
      if (!course) throw new Error(`Course "${id}" not found.`);
      const url = link(GURUKUL_ROUTES.courseDetail(id));

      const existing = await getOwnEnrollment(db, userId, id);
      if (hasActiveAccess(existing) && !renew) {
        return reply(`Already enrolled in ${course.title} (${describeEnrollment(existing)}). Nothing changed.\n${url}`, {
          courseId: id,
          enrolled: true,
          changed: false,
          expiresAt: existing.expiresAt,
          url,
        });
      }

      const enrollment = mapEnrollmentRow(unwrap(await db.rpc("checkout", { p_course_id: id })));
      return reply(
        `${existing ? "Renewed" : "Enrolled in"} ${course.title} — access until ${enrollment.expiresAt.slice(0, 10)}.\nStart learning: ${url}`,
        { courseId: id, enrolled: true, changed: true, expiresAt: enrollment.expiresAt, url }
      );
    })
  );

  server.registerPrompt(
    "brush_up",
    {
      title: "Brush up on a topic",
      description: "A quick refresher on something you learned in a Gurukul course.",
      argsSchema: z.object({ topic: z.string().describe("What you want to refresh") }),
    },
    ({ topic }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Use the Gurukul recap_topic tool for "${topic}" and give me a 5-bullet refresher from my own course lessons, naming the lesson each point comes from. If none of my courses cover it, suggest a course with search_courses.`,
          },
        },
      ],
    })
  );
}
