import { GURUKUL_ROUTES } from "@/lib/gurukul/routes";

// Single source of truth for auth route paths and the post-auth destination.
export const AUTH_ROUTES = {
  signup: "/auth/signup",
  login: "/auth/login",
  recovery: "/auth/recovery",
  recoveryReset: "/auth/recovery/reset",
  code: "/auth/code",
};

// The Learning Hub now exists — sign-in/sign-up lands there.
const POST_AUTH_DESTINATION = GURUKUL_ROUTES.home;

// An AI agent connecting to the MCP server sends a signed-out user to
// /oauth/consent, which remembers itself here before redirecting to login.
// Login, signup and the code screen all finish with getPostAuthDestination(),
// so the user lands back on the consent page. sessionStorage keeps it to this
// tab; only /oauth/ paths are accepted (no open redirects), and only for
// 30 minutes (an OAuth authorization request expires anyway).
const RETURN_PATH_KEY = "gurukul.auth.returnPath";
const RETURN_PATH_MAX_AGE_MS = 30 * 60 * 1000;

function isAllowedReturnPath(path) {
  return typeof path === "string" && path.startsWith("/oauth/") && !path.includes("\\");
}

export function rememberReturnPath(path) {
  if (!isAllowedReturnPath(path)) return;
  try {
    sessionStorage.setItem(RETURN_PATH_KEY, JSON.stringify({ path, savedAt: Date.now() }));
  } catch {
    // sessionStorage unavailable — the user just lands on the Learning Hub.
  }
}

export function clearReturnPath() {
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {
    // Nothing to clear.
  }
}

function getReturnPath() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(RETURN_PATH_KEY) ?? "null");
    if (saved && isAllowedReturnPath(saved.path) && Date.now() - saved.savedAt < RETURN_PATH_MAX_AGE_MS) {
      return saved.path;
    }
  } catch {
    // Unreadable — fall through to the default.
  }
  return null;
}

export function getPostAuthDestination() {
  return getReturnPath() ?? POST_AUTH_DESTINATION;
}
