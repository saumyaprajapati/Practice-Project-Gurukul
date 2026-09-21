// Carries the email + intent between auth screens (e.g. signup -> code,
// recovery -> code) without ever putting it in the URL. sessionStorage
// scopes it to the tab and clears itself when the tab closes.
//
// Shape mirrors what a real backend would need to resolve "which pending
// verification does this code belong to" — a later phase can swap the raw
// email for a server-issued opaque token without touching call sites.
const STORAGE_KEY = "gurukul.auth.flow";

export function setAuthHandoff({ intent, email }) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, intent, email, issuedAt: Date.now() })
    );
  } catch {
    // sessionStorage unavailable (SSR, privacy mode) — nothing to persist.
  }
}

export function getAuthHandoff() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.intent) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuthHandoff() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
