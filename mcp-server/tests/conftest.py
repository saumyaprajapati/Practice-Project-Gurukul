"""Test harness: the real MCP server (uvicorn, random port) talking to a small
fake Supabase (Auth JWKS + /user, PostgREST tables and RPCs) in a thread.
"""

import json
import socket
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
import jwt
import pytest
import uvicorn
from cryptography.hazmat.primitives.asymmetric import rsa

from gurukul_mcp.config import Settings
from gurukul_mcp.server import build_app

USER_ID = "11111111-1111-1111-1111-111111111111"
KID = "test-key"
PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
HS_SECRET = "hs-secret-only-supabase-knows-0123456789"
COURSE = {
    "id": "docker-and-containers",
    "title": "Docker & Containers",
    "description": "Package software.",
    "category": "Systems",
    "instructor": "V. Nair",
    "thumbnail": None,
    "price": 149900,
}


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class FakeSupabase:
    def __init__(self) -> None:
        self.port = free_port()
        self.url = f"http://127.0.0.1:{self.port}"
        self.issuer = f"{self.url}/auth/v1"
        self.calls: list[dict[str, Any]] = []
        self.enrolled = False
        self.valid_hs_tokens: set[str] = set()

    # --- tokens -----------------------------------------------------------
    def token(self, alg: str = "RS256", **overrides: Any) -> str:
        claims = {
            "sub": USER_ID,
            "role": "authenticated",
            "email": "learner@test",
            "iss": self.issuer,
            "aud": "authenticated",
            "client_id": "client-abc",
            "scope": "openid email",
            "exp": int(time.time()) + 3600,
            **overrides,
        }
        claims = {k: v for k, v in claims.items() if v is not None}
        if alg == "HS256":
            token = jwt.encode(claims, HS_SECRET, algorithm="HS256")
            self.valid_hs_tokens.add(token)
            return token
        return jwt.encode(claims, PRIVATE_KEY, algorithm="RS256", headers={"kid": KID})

    def jwks(self) -> dict[str, Any]:
        public = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(PRIVATE_KEY.public_key()))
        return {"keys": [{**public, "kid": KID, "alg": "RS256", "use": "sig"}]}

    # --- routes -----------------------------------------------------------
    def handle(self, method: str, path: str, query: dict[str, str], auth: str, body: Any) -> tuple[int, Any]:
        self.calls.append({"method": method, "path": path, "query": query, "auth": auth, "body": body})
        if path == "/auth/v1/.well-known/jwks.json":
            return 200, self.jwks()
        if path == "/auth/v1/user":
            token = auth.removeprefix("Bearer ")
            return (200, {"id": USER_ID}) if token in self.valid_hs_tokens else (401, {"msg": "invalid JWT"})

        if not path.startswith("/rest/v1/"):
            return 404, {"message": f"no route {path}"}
        enr = {
            "user_id": USER_ID,
            "course_id": COURSE["id"],
            "status": "active",
            "purchased_at": "2026-09-30T10:00:00+00:00",
            "expires_at": "2099-09-30T10:00:00.52761+00:00",
            "progress_percent": 50,
        }
        route = path.removeprefix("/rest/v1/")
        if route == "profiles":
            return 200, [{"name": "Asha", "is_instructor": False, "is_admin": False}]
        if route == "rpc/search_courses":
            return 200, [
                {**{k: COURSE[k] for k in ("id", "title", "description", "category", "instructor", "price")},
                 "is_enrolled": self.enrolled, "matched_lessons": ["Volumes"], "rank": 1.6}
            ]
        if route == "rpc/search_my_lessons":
            if not self.enrolled:
                return 200, []
            return 200, [{"course_id": COURSE["id"], "course_title": COURSE["title"], "module_title": "Module 2",
                          "lesson_key": "volumes", "lesson_title": "Volumes", "snippet": "**volumes**",
                          "content": "Docker volumes persist data.", "completed": True, "rank": 1}]
        if route == "courses":
            return 200, [COURSE] if query.get("id") == f"eq.{COURSE['id']}" else []
        if route == "course_modules":
            return 200, [{"id": "m1", "title": "Module 1", "position": 1, "course_lessons": [
                {"id": "l2", "lesson_key": "volumes", "title": "Volumes", "duration_minutes": 10, "position": 2,
                 "is_preview": False, "course_lesson_content": [{"content": "Docker volumes persist data."}] if self.enrolled else [],
                 "course_lesson_media": []},
                {"id": "l1", "lesson_key": "intro", "title": "Intro", "duration_minutes": 5, "position": 1, "is_preview": True,
                 "course_lesson_content": [{"content": "Hello.\n\nSecond paragraph."}],
                 "course_lesson_media": [{"id": "f", "kind": "file", "storage_path": "x", "external_url": None,
                                          "file_name": "notes.pdf", "mime_type": "application/pdf", "size_bytes": 1, "position": 1}]},
            ]}]
        if route == "enrollments":
            if not self.enrolled:
                return 200, []
            return 200, [{**enr, "courses": {k: COURSE[k] for k in ("title", "category", "instructor")}}]
        if route == "lesson_progress":
            return 200, [{"course_id": COURSE["id"]}] if self.enrolled else []
        if route == "rpc/checkout":
            self.enrolled = True
            return 200, enr
        return 404, {"message": f"no route {path}"}

    def start(self) -> None:
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def _serve(self) -> None:
                url = urlparse(self.path)
                length = int(self.headers.get("content-length") or 0)
                raw = self.rfile.read(length) if length else b""
                body = json.loads(raw) if raw else None
                query = {k: v[0] for k, v in parse_qs(url.query).items()}
                status, payload = fake.handle(self.command, url.path, query, self.headers.get("authorization", ""), body)
                data = json.dumps(payload).encode()
                self.send_response(status)
                self.send_header("content-type", "application/json")
                self.send_header("content-length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            do_GET = do_POST = _serve

            def log_message(self, *args: Any) -> None:
                pass

        self.server = ThreadingHTTPServer(("127.0.0.1", self.port), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()


class McpClient:
    """Raw JSON-RPC over Streamable HTTP, like an agent sends it."""

    def __init__(self, base: str, token: str | None) -> None:
        self.base = base
        self.token = token

    def post(self, method: str, params: dict[str, Any] | None = None, token: str | None | object = ..., host: str | None = None) -> httpx.Response:
        headers = {"accept": "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18"}
        tok = self.token if token is ... else token
        if tok:
            headers["authorization"] = f"Bearer {tok}"
        if host:
            headers["host"] = host
        body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}}
        return httpx.post(f"{self.base}/mcp", json=body, headers=headers, timeout=15)

    def result(self, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        response = self.post(method, params)
        assert response.status_code == 200, response.text
        payload = response.json()
        assert "error" not in payload, payload
        return payload["result"]

    def call(self, name: str, **arguments: Any) -> dict[str, Any]:
        return self.result("tools/call", {"name": name, "arguments": arguments})


def text(result: dict[str, Any]) -> str:
    return result["content"][0]["text"]


@pytest.fixture(scope="session")
def fake() -> FakeSupabase:
    supabase = FakeSupabase()
    supabase.start()
    return supabase


@pytest.fixture(scope="session")
def mcp_base(fake: FakeSupabase) -> str:
    port = free_port()
    config = Settings(
        supabase_url=fake.url,
        supabase_publishable_key="sb_publishable_test",
        app_url="http://localhost:3000",
        public_url=f"http://127.0.0.1:{port}",
        host="127.0.0.1",
        port=port,
    )
    server = uvicorn.Server(uvicorn.Config(build_app(config), host="127.0.0.1", port=port, log_level="warning"))
    threading.Thread(target=server.run, daemon=True).start()
    for _ in range(100):
        if server.started:
            break
        time.sleep(0.05)
    yield f"http://127.0.0.1:{port}"
    server.should_exit = True


@pytest.fixture
def client(mcp_base: str, fake: FakeSupabase) -> McpClient:
    fake.enrolled = False
    fake.calls.clear()
    return McpClient(mcp_base, fake.token())
