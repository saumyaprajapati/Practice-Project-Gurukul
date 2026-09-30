import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { verifyToken } from "@/lib/mcp/auth";
import { METADATA_PATH } from "@/lib/mcp/metadata";
import { registerTools, SERVER_INSTRUCTIONS } from "@/lib/mcp/tools";

// The Gurukul MCP server (Streamable HTTP, stateless) at /api/mcp. Every
// request must carry a Supabase OAuth access token; without one the agent
// gets a 401 pointing at the protected resource metadata and runs the OAuth
// login (see MCP.md).
const handler = createMcpHandler(registerTools, {
  serverInfo: { name: "gurukul", version: "1.0.0" },
  instructions: SERVER_INSTRUCTIONS,
});

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: METADATA_PATH,
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
