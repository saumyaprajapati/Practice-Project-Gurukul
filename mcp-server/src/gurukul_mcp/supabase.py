"""Supabase Data API (PostgREST) calls made *as the signed-in user*.

Same idea as the website's browser client: publishable key + the user's
access token, so RLS and the RPCs' own checks decide what comes back.
"""

from typing import Any

import httpx
from mcp.server.mcpserver.exceptions import ToolError

# SQLSTATEs raised by the RPCs (supabase/phase5b-baas.sql) and PostgREST codes,
# with a fallback message when the database gave none (frontend/src/lib/supabase/errors.js).
FALLBACK_MESSAGES = {
    "28000": "Not signed in. Reconnect the Gurukul MCP server to log in.",
    "42501": "You don't have permission to do that.",
    "P0002": "Not found.",
    "PGRST116": "Not found.",
    "22023": "Invalid request.",
}


class SupabaseClient:
    def __init__(self, base_url: str, publishable_key: str, access_token: str, transport: httpx.AsyncBaseTransport | None = None):
        self._http = httpx.AsyncClient(
            base_url=f"{base_url}/rest/v1",
            headers={"apikey": publishable_key, "Authorization": f"Bearer {access_token}"},
            timeout=15.0,
            transport=transport,
        )

    async def __aenter__(self) -> "SupabaseClient":
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self._http.aclose()

    async def select(self, table: str, params: dict[str, str]) -> list[dict[str, Any]]:
        """GET /rest/v1/<table>?<params> — always a list of rows."""
        return self._unwrap(await self._http.get(f"/{table}", params=params))

    async def select_one(self, table: str, params: dict[str, str]) -> dict[str, Any] | None:
        rows = await self.select(table, {**params, "limit": "1"})
        return rows[0] if rows else None

    async def rpc(self, name: str, args: dict[str, Any] | None = None) -> Any:
        """POST /rest/v1/rpc/<name> with the named p_* arguments."""
        return self._unwrap(await self._http.post(f"/rpc/{name}", json=args or {}))

    @staticmethod
    def _unwrap(response: httpx.Response) -> Any:
        if response.is_success:
            return response.json() if response.content else None
        try:
            body = response.json()
        except ValueError:
            body = {}
        code = str(body.get("code", ""))
        if response.status_code == 401:
            code = code or "28000"
        message = body.get("message") or FALLBACK_MESSAGES.get(code) or "Something went wrong. Please try again."
        raise ToolError(message)
