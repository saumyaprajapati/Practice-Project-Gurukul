"""Settings, read from the environment (or mcp-server/.env).

Only the Supabase *publishable* key is used: every query runs with the
signed-in user's own token, so RLS applies. Never put the secret key here.
"""

import os
from dataclasses import dataclass
from urllib.parse import urlparse

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_publishable_key: str
    app_url: str
    public_url: str
    host: str
    port: int

    @property
    def auth_issuer(self) -> str:
        """Supabase Auth's OAuth 2.1 server, which issues the tokens we accept."""
        return f"{self.supabase_url}/auth/v1"

    @property
    def resource_url(self) -> str:
        """This MCP endpoint's public URL (the OAuth resource identifier)."""
        return f"{self.public_url}/mcp"

    @property
    def public_host(self) -> str:
        return urlparse(self.public_url).netloc


def _required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not set. Copy .env.example to .env and fill it in.")
    return value


def load_settings() -> Settings:
    load_dotenv()
    port = int(os.environ.get("PORT", "8000"))
    return Settings(
        supabase_url=_required("SUPABASE_URL").rstrip("/"),
        supabase_publishable_key=_required("SUPABASE_PUBLISHABLE_KEY"),
        app_url=os.environ.get("GURUKUL_APP_URL", "http://localhost:3000").rstrip("/"),
        public_url=os.environ.get("MCP_PUBLIC_URL", f"http://localhost:{port}").rstrip("/"),
        host=os.environ.get("HOST", "127.0.0.1"),
        port=port,
    )
