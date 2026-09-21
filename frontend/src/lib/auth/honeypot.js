// Client-side bot trap for the signup/login honeypot field. This is a UX
// deterrent only, NOT a real security control — a genuine block must be
// enforced server-side. Function names map 1:1 onto what that server-side
// check would do, so a later phase can swap the bodies for API calls
// without changing call sites.
const LOCKOUT_KEY = "gurukul.auth.honeypotLockUntil";
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

// Shared, deliberately generic copy for any auth form blocked by the
// honeypot — never reveals that a bot trap exists.
export const HONEYPOT_BLOCKED_MESSAGE =
  "Something went wrong. Please try again in a few minutes.";

export function isHoneypotTripped(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function triggerHoneypotLockout() {
  try {
    localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION_MS));
  } catch {
    // Nothing to persist.
  }
}

export function isHoneypotLocked() {
  try {
    const until = Number(localStorage.getItem(LOCKOUT_KEY));
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}
