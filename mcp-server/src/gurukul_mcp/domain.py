"""Pure helpers ported from the website so the MCP server behaves the same:
frontend/src/lib/courses/{enrollment,courses,curriculum,currency}.js.
"""

import re
from datetime import datetime, timezone
from typing import Any

COURSE_FIELDS = "id,title,description,category,instructor,thumbnail,price"

# Same select as lib/courses/courses.js getCourseCurriculum(). Lesson text and
# media share one RLS rule, so a lesson without a content row is locked.
CURRICULUM_SELECT = (
    "id,title,position,course_lessons(id,lesson_key,title,duration_minutes,position,is_preview,"
    "course_lesson_content(content),"
    "course_lesson_media(id,kind,storage_path,external_url,file_name,mime_type,size_bytes,position))"
)


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def day(value: str) -> str:
    """ISO timestamp -> YYYY-MM-DD."""
    return value[:10]


def format_price(amount: int | float) -> str:
    """₹ with Indian digit grouping and no decimals, like Intl.NumberFormat('en-IN', INR)."""
    digits = str(round(amount))
    sign = "-" if digits.startswith("-") else ""
    digits = digits.lstrip("-")
    if len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        head = ",".join(re.findall(r"\d{1,2}(?=(?:\d{2})*$)", head))
        digits = f"{head},{tail}"
    return f"{sign}₹{digits}"


def map_enrollment(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if not row:
        return None
    return {
        "courseId": row["course_id"],
        "userId": row["user_id"],
        "status": row["status"],
        "purchasedAt": row["purchased_at"],
        "expiresAt": row["expires_at"],
        "progress": row["progress_percent"],
    }


def has_active_access(enrollment: dict[str, Any] | None) -> bool:
    if not enrollment:
        return False
    return enrollment["status"] == "active" and parse_time(enrollment["expiresAt"]) > datetime.now(timezone.utc)


def course_state(enrollment: dict[str, Any] | None) -> str:
    if not enrollment or enrollment["progress"] == 0:
        return "not-started"
    if enrollment["progress"] >= 100:
        return "completed"
    return "in-progress"


def describe_enrollment(enrollment: dict[str, Any] | None) -> str:
    if not enrollment:
        return "not enrolled"
    if not has_active_access(enrollment):
        return f"access expired on {day(enrollment['expiresAt'])}"
    return f"enrolled, {enrollment['progress']}% complete, access until {day(enrollment['expiresAt'])}"


def map_curriculum(modules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """PostgREST course_modules rows -> [{id, title, lessons: [...]}], like getCourseCurriculum()."""
    result = []
    for module in sorted(modules, key=lambda m: m["position"]):
        lessons = []
        for lesson in sorted(module.get("course_lessons") or [], key=lambda item: item["position"]):
            content_row = lesson.get("course_lesson_content")
            if isinstance(content_row, list):
                content_row = content_row[0] if content_row else None
            media = sorted(lesson.get("course_lesson_media") or [], key=lambda item: item["position"])
            lessons.append(
                {
                    "id": lesson["lesson_key"],
                    "title": lesson["title"],
                    "durationMinutes": lesson["duration_minutes"],
                    "isPreview": bool(lesson["is_preview"]),
                    "locked": content_row is None,
                    "content": [p.strip() for p in re.split(r"\n\s*\n", content_row["content"])] if content_row else [],
                    "hasVideo": any(item["kind"] in ("video", "video_link") for item in media),
                    "files": [item["file_name"] for item in media if item["kind"] == "file"],
                }
            )
        result.append({"id": module["id"], "title": module["title"], "lessons": lessons})
    return result


def flatten_lessons(modules: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Ordered lessons across modules, each with its module title (lib/courses/curriculum.js)."""
    return [{**lesson, "moduleTitle": module["title"]} for module in modules for lesson in module["lessons"]]
