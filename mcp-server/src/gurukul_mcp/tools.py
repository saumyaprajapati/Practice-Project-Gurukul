"""The Gurukul MCP tools, prompt and server instructions.

Every call runs as the user who approved the agent: the verified token from
the request is passed to Supabase, so RLS and the RPCs' own checks apply
exactly as on the website.
"""

from collections import Counter
from contextlib import asynccontextmanager
from typing import Annotated, Any, AsyncIterator, Literal

from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp_types import CallToolResult, TextContent, ToolAnnotations
from pydantic import Field

from gurukul_mcp.config import Settings
from gurukul_mcp.domain import (
    COURSE_FIELDS,
    CURRICULUM_SELECT,
    course_state,
    day,
    describe_enrollment,
    flatten_lessons,
    format_price,
    has_active_access,
    map_curriculum,
    map_enrollment,
)
from gurukul_mcp.supabase import SupabaseClient

SERVER_INSTRUCTIONS = """Gurukul is an online learning platform. Use these tools for the signed-in learner:
- New term or technology while working? search_courses finds the Gurukul course that teaches it; get_course shows its outline.
- list_my_courses shows what they are enrolled in and how far they got.
- To refresh something they learned, call recap_topic and summarise the returned lesson text briefly, citing the course and lesson. Don't invent material that isn't in the lessons.
- enroll_in_course enrols them in a course. Always ask the user and wait for a clear yes before calling it."""

READ_ONLY = ToolAnnotations(read_only_hint=True, open_world_hint=False)

CourseId = Annotated[
    str,
    Field(min_length=1, max_length=200, description='Course id, e.g. "react-in-depth" (from search_courses or list_my_courses)'),
]


def reply(text: str, structured: dict[str, Any]) -> CallToolResult:
    return CallToolResult(content=[TextContent(type="text", text=text)], structured_content=structured)


def register_tools(server: MCPServer, settings: Settings) -> None:
    def link(course_id: str) -> str:
        return f"{settings.app_url}/gurukul/courses/{course_id}"

    @asynccontextmanager
    async def signed_in() -> AsyncIterator[tuple[SupabaseClient, str, str | None]]:
        """(Supabase client as the caller, their user id, their email)."""
        token = get_access_token()
        if token is None or not token.subject:
            raise ToolError("Not signed in. Reconnect the Gurukul MCP server to log in.")
        async with SupabaseClient(settings.supabase_url, settings.supabase_publishable_key, token.token) as db:
            yield db, token.subject, (token.claims or {}).get("email")

    async def own_enrollment(db: SupabaseClient, user_id: str, course_id: str) -> dict[str, Any] | None:
        # Admins can read every enrollment, so always filter to the caller.
        row = await db.select_one("enrollments", {"select": "*", "user_id": f"eq.{user_id}", "course_id": f"eq.{course_id}"})
        return map_enrollment(row)

    async def get_course_row(db: SupabaseClient, course_id: str) -> dict[str, Any]:
        course = await db.select_one("courses", {"select": COURSE_FIELDS, "id": f"eq.{course_id}"})
        if course is None:
            raise ToolError(f'Course "{course_id}" not found.')
        return course

    async def get_curriculum(db: SupabaseClient, course_id: str) -> list[dict[str, Any]]:
        rows = await db.select("course_modules", {"select": CURRICULUM_SELECT, "course_id": f"eq.{course_id}", "order": "position"})
        return map_curriculum(rows)

    @server.tool(
        title="Who am I",
        description="The Gurukul account this agent is connected as: name, email and role.",
        annotations=READ_ONLY,
    )
    async def whoami() -> CallToolResult:
        async with signed_in() as (db, user_id, email):
            profile = await db.select_one("profiles", {"select": "name,is_instructor,is_admin", "id": f"eq.{user_id}"}) or {}
        me = {
            "userId": user_id,
            "name": profile.get("name"),
            "email": email,
            "isInstructor": bool(profile.get("is_instructor")),
            "isAdmin": bool(profile.get("is_admin")),
        }
        role = "admin" if me["isAdmin"] else "instructor" if me["isInstructor"] else "learner"
        return reply(f"Signed in to Gurukul as {me['name'] or 'Learner'} <{email}> ({role}).", me)

    @server.tool(
        title="Search courses",
        description=(
            'Find Gurukul courses that teach a technology, tool or concept (e.g. "docker volumes", "JWT", "SQL joins"). '
            "Returns the best matches, which lessons matched, the price and whether the user is already enrolled."
        ),
        annotations=READ_ONLY,
    )
    async def search_courses(
        query: Annotated[str, Field(min_length=1, max_length=200, description="The term or technology to look for")],
        limit: Annotated[int, Field(ge=1, le=25, description="Max results (default 10)")] = 10,
    ) -> CallToolResult:
        async with signed_in() as (db, _, _email):
            rows = await db.rpc("search_courses", {"p_query": query.strip(), "p_limit": limit})
        courses = [
            {
                "courseId": row["id"],
                "title": row["title"],
                "description": row["description"],
                "category": row["category"],
                "instructor": row["instructor"],
                "price": format_price(row["price"]),
                "isEnrolled": bool(row["is_enrolled"]),
                "matchedLessons": row.get("matched_lessons") or [],
                "url": link(row["id"]),
            }
            for row in rows
        ]
        if not courses:
            return reply(f'No Gurukul course matches "{query}". Try a broader or different term.', {"courses": courses})
        lines = []
        for i, c in enumerate(courses, 1):
            line = f"{i}. {c['title']} (id: {c['courseId']}) — {c['category']}, by {c['instructor']}, {c['price']}"
            line += " — already enrolled" if c["isEnrolled"] else ""
            line += f"\n   {c['description']}"
            if c["matchedLessons"]:
                line += f"\n   Matching lessons: {'; '.join(c['matchedLessons'])}"
            lines.append(f"{line}\n   {c['url']}")
        return reply(f'Courses for "{query}":\n\n' + "\n".join(lines), {"courses": courses})

    @server.tool(
        title="Course details",
        description="A course's description, price, module and lesson outline, and the user's enrolment status.",
        annotations=READ_ONLY,
    )
    async def get_course(course_id: CourseId) -> CallToolResult:
        async with signed_in() as (db, user_id, _email):
            course = await get_course_row(db, course_id)
            modules = await get_curriculum(db, course_id)
            enrollment = await own_enrollment(db, user_id, course_id)
        outline_modules = [
            {
                "title": module["title"],
                "lessons": [
                    {k: lesson[k] for k in ("id", "title", "durationMinutes", "isPreview", "locked")} for lesson in module["lessons"]
                ],
            }
            for module in modules
        ]
        lesson_count = sum(len(module["lessons"]) for module in modules)
        result = {
            "courseId": course["id"],
            "title": course["title"],
            "description": course["description"],
            "category": course["category"],
            "instructor": course["instructor"],
            "price": format_price(course["price"]),
            "enrollment": (
                {"active": has_active_access(enrollment), "progress": enrollment["progress"], "expiresAt": enrollment["expiresAt"]}
                if enrollment
                else None
            ),
            "lessonCount": lesson_count,
            "modules": outline_modules,
            "url": link(course["id"]),
        }
        outline = "\n".join(
            f"{i}. {module['title']}\n"
            + "\n".join(
                f"   - {lesson['title']} ({lesson['durationMinutes']} min{', free preview' if lesson['isPreview'] else ''})"
                for lesson in module["lessons"]
            )
            for i, module in enumerate(modules, 1)
        )
        text = (
            f"{course['title']} — {course['category']}, by {course['instructor']}, {result['price']}\n{course['description']}\n"
            f"You: {describe_enrollment(enrollment)}\n{lesson_count} lessons:\n{outline}\n{result['url']}"
        )
        return reply(text, result)

    @server.tool(
        title="My courses",
        description="The courses the user is enrolled in, with progress, completed lessons and access expiry.",
        annotations=READ_ONLY,
    )
    async def list_my_courses(
        filter: Annotated[
            Literal["active", "completed", "expired", "all"],
            Field(description="active (default): courses they can open now; completed: finished ones; expired; all"),
        ] = "active",
    ) -> CallToolResult:
        async with signed_in() as (db, user_id, _email):
            rows = await db.select(
                "enrollments",
                {"select": "*,courses(title,category,instructor)", "user_id": f"eq.{user_id}", "order": "purchased_at.desc"},
            )
            progress_rows = await db.select("lesson_progress", {"select": "course_id", "user_id": f"eq.{user_id}"})
        completed_by_course = Counter(row["course_id"] for row in progress_rows)

        courses = []
        for row in rows:
            enrollment = map_enrollment(row)
            info = row.get("courses") or {}
            courses.append(
                {
                    "courseId": row["course_id"],
                    "title": info.get("title") or row["course_id"],
                    "category": info.get("category") or "",
                    "instructor": info.get("instructor") or "",
                    "active": has_active_access(enrollment),
                    "state": course_state(enrollment),
                    "progress": enrollment["progress"],
                    "completedLessons": completed_by_course.get(row["course_id"], 0),
                    "enrolledAt": enrollment["purchasedAt"],
                    "expiresAt": enrollment["expiresAt"],
                    "url": link(row["course_id"]),
                }
            )
        keep = {
            "all": lambda c: True,
            "expired": lambda c: not c["active"],
            "completed": lambda c: c["state"] == "completed",
            "active": lambda c: c["active"],
        }[filter]
        courses = [c for c in courses if keep(c)]

        label = "" if filter == "all" else f"{filter} "
        if not courses:
            return reply(f"No {label}courses yet. Use search_courses to find one.", {"courses": courses})
        lines = [
            f"- {c['title']} (id: {c['courseId']}) — {c['progress']}% ({c['completedLessons']} lessons done), "
            + (f"access until {day(c['expiresAt'])}" if c["active"] else f"expired {day(c['expiresAt'])}")
            + f"\n  {c['url']}"
            for c in courses
        ]
        return reply(f"Your {label}courses:\n" + "\n".join(lines), {"courses": courses})

    @server.tool(
        title="Brush up on a topic",
        description=(
            "Finds the lessons in the user's own courses that cover a topic and returns their text, so you can write a "
            "short refresher. Only courses the user currently has access to are searched."
        ),
        annotations=READ_ONLY,
    )
    async def recap_topic(
        query: Annotated[str, Field(min_length=1, max_length=200, description='What they want to brush up on, e.g. "git rebase vs merge"')],
        course_id: Annotated[str | None, Field(max_length=200, description="Only search this course")] = None,
    ) -> CallToolResult:
        async with signed_in() as (db, _, _email):
            rows = await db.rpc("search_my_lessons", {"p_query": query.strip(), "p_course_id": course_id or None, "p_limit": 5})
        lessons = [
            {
                "courseId": row["course_id"],
                "courseTitle": row["course_title"],
                "moduleTitle": row["module_title"],
                "lessonId": row["lesson_key"],
                "lessonTitle": row["lesson_title"],
                "completed": bool(row["completed"]),
                "snippet": row["snippet"],
                "content": row["content"],
                "url": link(row["course_id"]),
            }
            for row in rows
        ]
        if not lessons:
            where = f" in {course_id}" if course_id else ""
            return reply(
                f'None of your current courses cover "{query}"{where}. Call search_courses to find a course that teaches it '
                "(the user may need to enrol, or renew an expired course).",
                {"lessons": lessons},
            )
        blocks = [
            f"### {i}. {l['lessonTitle']}\nCourse: {l['courseTitle']} › {l['moduleTitle']} "
            f"(lesson id: {l['lessonId']}{', completed' if l['completed'] else ''})\n{l['url']}\n\n{l['content']}"
            for i, l in enumerate(lessons, 1)
        ]
        return reply(
            f'Lessons from the user\'s courses about "{query}". Write a short refresher from this text only, and name the '
            "lesson(s) it came from.\n\n" + "\n\n".join(blocks),
            {"lessons": lessons},
        )

    @server.tool(
        title="Read a lesson",
        description="The full text of one lesson, plus its attached files. Locked unless the user is enrolled or it's a free preview.",
        annotations=READ_ONLY,
    )
    async def get_lesson(
        course_id: CourseId,
        lesson_id: Annotated[str, Field(min_length=1, max_length=200, description="Lesson id from get_course or recap_topic")],
    ) -> CallToolResult:
        async with signed_in() as (db, _, _email):
            lessons = flatten_lessons(await get_curriculum(db, course_id))
        lesson = next((item for item in lessons if item["id"] == lesson_id), None)
        if lesson is None:
            raise ToolError(f'Lesson "{lesson_id}" not found in course "{course_id}".')
        url = link(course_id)
        result = {
            "courseId": course_id,
            "moduleTitle": lesson["moduleTitle"],
            "lessonId": lesson_id,
            "lessonTitle": lesson["title"],
            "durationMinutes": lesson["durationMinutes"],
            "locked": lesson["locked"],
            "content": "\n\n".join(lesson["content"]),
            "hasVideo": lesson["hasVideo"],
            "files": lesson["files"],
            "url": url,
        }
        if lesson["locked"]:
            return reply(
                f'"{lesson["title"]}" is locked. Enrol in the course to read it (enroll_in_course, after asking the user).', result
            )
        extras = [x for x in ("a video" if lesson["hasVideo"] else "", f"files: {', '.join(lesson['files'])}" if lesson["files"] else "") if x]
        text = f"{lesson['title']} ({lesson['moduleTitle']})\n\n{result['content']}"
        if extras:
            text += f"\n\nAlso in the app: {'; '.join(extras)} — {url}"
        return reply(text, result)

    @server.tool(
        title="Enrol in a course",
        description=(
            "Enrols the user in a course for 365 days (mock checkout: no payment is taken). Ask the user and wait for a clear "
            "yes before calling. If they already have active access nothing changes unless renew is true."
        ),
        annotations=ToolAnnotations(read_only_hint=False, destructive_hint=False, idempotent_hint=True, open_world_hint=False),
    )
    async def enroll_in_course(
        course_id: CourseId,
        renew: Annotated[bool, Field(description="Restart the 365 days even if access is still active")] = False,
    ) -> CallToolResult:
        async with signed_in() as (db, user_id, _email):
            course = await get_course_row(db, course_id)
            url = link(course_id)
            existing = await own_enrollment(db, user_id, course_id)
            if has_active_access(existing) and not renew:
                return reply(
                    f"Already enrolled in {course['title']} ({describe_enrollment(existing)}). Nothing changed.\n{url}",
                    {"courseId": course_id, "enrolled": True, "changed": False, "expiresAt": existing["expiresAt"], "url": url},
                )
            enrollment = map_enrollment(await db.rpc("checkout", {"p_course_id": course_id}))
        verb = "Renewed" if existing else "Enrolled in"
        return reply(
            f"{verb} {course['title']} — access until {day(enrollment['expiresAt'])}.\nStart learning: {url}",
            {"courseId": course_id, "enrolled": True, "changed": True, "expiresAt": enrollment["expiresAt"], "url": url},
        )

    @server.prompt(title="Brush up on a topic", description="A quick refresher on something you learned in a Gurukul course.")
    def brush_up(topic: Annotated[str, Field(description="What you want to refresh")]) -> str:
        return (
            f'Use the Gurukul recap_topic tool for "{topic}" and give me a 5-bullet refresher from my own course lessons, '
            "naming the lesson each point comes from. If none of my courses cover it, suggest a course with search_courses."
        )
