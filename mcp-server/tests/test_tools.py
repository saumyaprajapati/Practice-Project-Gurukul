"""Every tool end to end over HTTP, as the signed-in user."""

import json

from conftest import COURSE, USER_ID, FakeSupabase, McpClient, text

TOOLS = ["enroll_in_course", "get_course", "get_lesson", "list_my_courses", "recap_topic", "search_courses", "whoami"]


def test_initialize_lists_tools_and_prompt(client: McpClient) -> None:
    init = client.result("initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
    assert init["serverInfo"]["name"] == "gurukul"
    assert "search_courses" in init["instructions"]
    tools = client.result("tools/list")["tools"]
    assert sorted(t["name"] for t in tools) == TOOLS
    enroll = next(t for t in tools if t["name"] == "enroll_in_course")
    assert "Ask the user" in enroll["description"]
    assert enroll["annotations"]["readOnlyHint"] is False
    assert client.result("prompts/list")["prompts"][0]["name"] == "brush_up"


def test_whoami(client: McpClient) -> None:
    result = client.call("whoami")
    assert text(result) == "Signed in to Gurukul as Asha <learner@test> (learner)."
    assert result["structuredContent"]["userId"] == USER_ID


def test_search_courses(client: McpClient) -> None:
    result = client.call("search_courses", query="docker volumes")
    assert "1. Docker & Containers (id: docker-and-containers) — Systems, by V. Nair, ₹1,49,900" in text(result)
    assert "Matching lessons: Volumes" in text(result)
    assert "http://localhost:3000/gurukul/courses/docker-and-containers" in text(result)
    assert result["structuredContent"]["courses"][0]["isEnrolled"] is False


def test_input_validation(client: McpClient) -> None:
    result = client.call("search_courses", query="")
    assert result.get("isError") is True


def test_before_enrolling(client: McpClient) -> None:
    assert "None of your current courses" in text(client.call("recap_topic", query="volumes"))
    assert "is locked" in text(client.call("get_lesson", course_id=COURSE["id"], lesson_id="volumes"))
    course = client.call("get_course", course_id=COURSE["id"])
    assert "You: not enrolled" in text(course)
    assert "1. Module 1\n   - Intro (5 min, free preview)\n   - Volumes (10 min)" in text(course)  # sorted by position
    assert course["structuredContent"]["lessonCount"] == 2
    assert "No active courses yet" in text(client.call("list_my_courses"))


def test_errors_are_tool_errors(client: McpClient) -> None:
    missing = client.call("get_course", course_id="nope")
    assert missing["isError"] is True and text(missing).endswith('Course "nope" not found.')
    lesson = client.call("get_lesson", course_id=COURSE["id"], lesson_id="nope")
    assert lesson["isError"] is True


def test_enrol_then_use_the_course(client: McpClient, fake: FakeSupabase) -> None:
    first = client.call("enroll_in_course", course_id=COURSE["id"])
    assert text(first).startswith("Enrolled in Docker & Containers — access until 2099-09-30.")
    again = client.call("enroll_in_course", course_id=COURSE["id"])
    assert "Already enrolled" in text(again) and again["structuredContent"]["changed"] is False
    renew = client.call("enroll_in_course", course_id=COURSE["id"], renew=True)
    assert text(renew).startswith("Renewed Docker & Containers")
    assert sum(c["path"] == "/rest/v1/rpc/checkout" for c in fake.calls) == 2

    mine = client.call("list_my_courses")
    assert "- Docker & Containers (id: docker-and-containers) — 50% (1 lessons done), access until 2099-09-30" in text(mine)
    assert "No completed courses yet" in text(client.call("list_my_courses", filter="completed"))

    recap = client.call("recap_topic", query="volumes")
    assert "Docker volumes persist data." in text(recap) and "completed" in text(recap)
    intro = client.call("get_lesson", course_id=COURSE["id"], lesson_id="intro")
    assert text(intro).startswith("Intro (Module 1)\n\nHello.\n\nSecond paragraph.")
    assert "files: notes.pdf" in text(intro)


def test_brush_up_prompt(client: McpClient) -> None:
    prompt = client.result("prompts/get", {"name": "brush_up", "arguments": {"topic": "volumes"}})
    assert 'recap_topic tool for "volumes"' in prompt["messages"][0]["content"]["text"]


def test_every_supabase_call_runs_as_the_user(client: McpClient, fake: FakeSupabase) -> None:
    client.call("enroll_in_course", course_id=COURSE["id"])
    client.call("list_my_courses", filter="all")
    client.call("recap_topic", query="volumes", course_id=COURSE["id"])
    rest = [c for c in fake.calls if c["path"].startswith("/rest/")]
    assert rest and all(c["auth"] == f"Bearer {client.token}" for c in rest)
    # Admins can read everyone's enrollments, so these are always filtered to the caller.
    for call in rest:
        if call["path"] in ("/rest/v1/enrollments", "/rest/v1/lesson_progress"):
            assert call["query"]["user_id"] == f"eq.{USER_ID}", call
    checkout = next(c for c in rest if c["path"] == "/rest/v1/rpc/checkout")
    assert checkout["body"] == {"p_course_id": COURSE["id"]}
    recap = next(c for c in rest if c["path"] == "/rest/v1/rpc/search_my_lessons")
    assert recap["body"] == {"p_query": "volumes", "p_course_id": COURSE["id"], "p_limit": 5}
    assert json.dumps(rest)  # recorded calls are plain data
