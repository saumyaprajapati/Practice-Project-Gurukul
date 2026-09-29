// Masks an email for privacy-conscious display on the code-entry screen.
export function maskEmail(email) {
  const [local, domain] = (email ?? "").split("@");
  if (!local || !domain) return email ?? "";
  return `${local[0]}***@${domain}`;
}
