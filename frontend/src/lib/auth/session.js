// Client-side stand-in for a real authenticated session. This is the one
// source of truth for "is the current user authenticated" across the
// prototype — not a real session/JWT (that stays out of scope until a
// backend exists), but isolated behind these functions so a real
// session/token check can replace the body later without touching call
// sites (the landing header, Login, Code Entry, Signup/Login route
// guards).
const SESSION_KEY = "gurukul.auth.session";

export function setAuthenticated() {
  try {
    localStorage.setItem(SESSION_KEY, "true");
  } catch {
    // localStorage unavailable — nothing to persist.
  }
}

export function isAuthenticated() {
  try {
    return localStorage.getItem(SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function clearAuthenticated() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}
