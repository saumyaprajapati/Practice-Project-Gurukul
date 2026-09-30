import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 "proxy" (formerly middleware) — keeps the Supabase Auth session
// fresh and guards /gurukul and /profile server-side. The MCP server
// (/api/mcp) and its OAuth metadata (/.well-known) use bearer tokens, not
// cookies, so they're left out.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/mcp|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
