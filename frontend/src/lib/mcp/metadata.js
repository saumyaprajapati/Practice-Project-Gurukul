import "server-only";
import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler";
import { authServerUrl } from "@/lib/mcp/supabase";

// RFC 9728 Protected Resource Metadata for /api/mcp: tells agents that
// Supabase Auth's OAuth 2.1 server issues the tokens the MCP server accepts.
// Served at /.well-known/oauth-protected-resource/api/mcp (what the 401
// challenge points to — its `resource` is exactly the MCP URL) and at the
// root /.well-known/oauth-protected-resource for clients that look there.
export const METADATA_PATH = "/.well-known/oauth-protected-resource/api/mcp";

export const metadataHandler = protectedResourceHandler({ authServerUrls: [authServerUrl()] });

export const metadataOptionsHandler = metadataCorsOptionsRequestHandler();
