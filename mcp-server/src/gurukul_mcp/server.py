"""Builds the Gurukul MCP server: Streamable HTTP (stateless) at /mcp, protected
by Supabase OAuth tokens, as an ASGI app.

Without a valid token /mcp answers 401 with
  WWW-Authenticate: Bearer resource_metadata="<MCP_PUBLIC_URL>/.well-known/oauth-protected-resource/mcp"
and that metadata document names Supabase Auth as the authorization server,
which is how agents know where to send the user to log in.
"""

from urllib.parse import urlparse

from mcp.server.auth.settings import AuthSettings
from mcp.server.mcpserver import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp

from gurukul_mcp.auth import SupabaseTokenVerifier
from gurukul_mcp.config import Settings
from gurukul_mcp.tools import SERVER_INSTRUCTIONS, register_tools


def build_mcp(config: Settings, verifier: SupabaseTokenVerifier | None = None) -> MCPServer:
    verifier = verifier or SupabaseTokenVerifier(config.auth_issuer, config.supabase_publishable_key)
    server = MCPServer(
        name="gurukul",
        title="Gurukul",
        version="1.0.0",
        instructions=SERVER_INSTRUCTIONS,
        website_url=config.app_url,
        token_verifier=verifier,
        auth=AuthSettings(
            issuer_url=config.auth_issuer,
            resource_server_url=config.resource_url,
            # Supabase tokens carry no resource indicator; the verifier checks issuer + role itself.
            validate_token_resource=False,
        ),
    )
    register_tools(server, config)
    return server


def _transport_security(config: Settings) -> TransportSecuritySettings:
    """DNS-rebinding protection: accept localhost plus the public host (tunnel / deployment)."""
    hosts = ["127.0.0.1:*", "localhost:*", "[::1]:*"]
    origins = ["http://127.0.0.1:*", "http://localhost:*", "http://[::1]:*"]
    public = urlparse(config.public_url)
    if public.hostname not in ("127.0.0.1", "localhost", "::1"):
        hosts.append(public.netloc)
        origins.append(f"{public.scheme}://{public.netloc}")
    return TransportSecuritySettings(enable_dns_rebinding_protection=True, allowed_hosts=hosts, allowed_origins=origins)


def build_app(config: Settings, verifier: SupabaseTokenVerifier | None = None) -> ASGIApp:
    server = build_mcp(config, verifier)
    app: Starlette = server.streamable_http_app(
        streamable_http_path="/mcp",
        stateless_http=True,
        json_response=True,
        transport_security=_transport_security(config),
        host=config.host,
    )
    # Browser-based clients (e.g. MCP Inspector) need CORS to call /mcp and read the auth challenge.
    return CORSMiddleware(
        app,
        allow_origins=["*"],
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Mcp-Protocol-Version", "Mcp-Session-Id", "Last-Event-ID"],
        expose_headers=["WWW-Authenticate", "Mcp-Session-Id"],
    )
