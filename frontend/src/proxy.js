import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 "proxy" (formerly middleware) — keeps the Supabase Auth session
// fresh and guards /gurukul and /profile server-side.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
