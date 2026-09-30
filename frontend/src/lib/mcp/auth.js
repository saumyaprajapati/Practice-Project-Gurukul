import "server-only";
import { getPublicOrigin } from "mcp-handler";
import { supabaseForToken } from "@/lib/mcp/supabase";

// Bearer-token check for withMcpAuth. The token is a Supabase access token
// (issued by the OAuth server after the user approves the agent on
// /oauth/consent). getClaims verifies its signature and expiry; returning
// undefined makes withMcpAuth answer 401 with the WWW-Authenticate challenge
// that starts the agent's OAuth flow.
export async function verifyToken(request, bearerToken) {
  if (!bearerToken) return undefined;

  const { data, error } = await supabaseForToken(bearerToken).auth.getClaims(bearerToken);
  const claims = data?.claims;
  if (error || !claims?.sub || claims.role !== "authenticated") return undefined;

  return {
    token: bearerToken,
    clientId: claims.client_id ?? "gurukul",
    scopes: typeof claims.scope === "string" ? claims.scope.split(" ").filter(Boolean) : [],
    expiresAt: claims.exp,
    extra: { userId: claims.sub, email: claims.email ?? null, origin: getPublicOrigin(request) },
  };
}
