// Temporary client-side stand-in for a real backend/email verification
// code. Isolated behind these three functions so a later phase can replace
// the bodies with API calls without changing any calling page.
const CODE_KEY = "gurukul.auth.code";

// Exact wording required by the auth contract — do not "fix" the typo.
export const INCORRECT_CODE_MESSAGE = "Incorrect Code Enterred";

export function issueVerificationCode() {
  // Idempotent: a remount (React Strict Mode, Fast Refresh) must not
  // invalidate a code already issued for the current pending verification.
  try {
    const existing = sessionStorage.getItem(CODE_KEY);
    if (existing) {
      console.info(`[auth/code] verification code: ${existing}`);
      return existing;
    }
  } catch {
    // Fall through and issue a fresh code.
  }

  const code = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  try {
    sessionStorage.setItem(CODE_KEY, code);
  } catch {
    // Nothing to persist.
  }
  // No real email exists yet — surface the code to developers only,
  // never in the rendered UI.
  console.info(`[auth/code] verification code: ${code}`);
  return code;
}

export function verifyCode(candidate) {
  try {
    return sessionStorage.getItem(CODE_KEY) === candidate;
  } catch {
    return false;
  }
}

export function clearVerificationCode() {
  try {
    sessionStorage.removeItem(CODE_KEY);
  } catch {
    // Nothing to clear.
  }
}
