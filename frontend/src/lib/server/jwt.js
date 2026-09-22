import "server-only";
import jwt from "jsonwebtoken";

// Both the 7-day session token and the short-lived password-reset token
// are signed with the same secret and distinguished by a `purpose` claim —
// one env var to manage instead of two.
const SESSION_EXPIRES_IN = "7d";
const RESET_EXPIRES_IN = "10m";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable.");
  return secret;
}

export function signSessionToken(userId) {
  return jwt.sign({ sub: userId, purpose: "session" }, getSecret(), {
    expiresIn: SESSION_EXPIRES_IN,
  });
}

export function signResetToken(userId) {
  return jwt.sign({ sub: userId, purpose: "password_reset" }, getSecret(), {
    expiresIn: RESET_EXPIRES_IN,
  });
}

// Returns the decoded payload for a token of the expected purpose, or null
// for anything invalid, expired, or signed for a different purpose — a
// prototype-scoped simplification, see plan's "guardrails" section.
export function verifyToken(token, expectedPurpose) {
  try {
    const payload = jwt.verify(token, getSecret());
    if (payload.purpose !== expectedPurpose) return null;
    return payload;
  } catch {
    return null;
  }
}
