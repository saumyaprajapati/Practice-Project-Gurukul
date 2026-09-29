// Small, explicit validators shared across auth forms. Each returns a
// string error message, or null when the value is valid — no schema
// framework, just plain functions.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value, label) {
  return value?.trim() ? null : `${label} is required.`;
}

export function validateEmail(value) {
  if (!value?.trim()) return "Email is required.";
  return EMAIL_PATTERN.test(value.trim()) ? null : "Enter a valid email address.";
}

export function validatePassword(value) {
  if (!value) return "Password is required.";
  return value.length >= 8 ? null : "Password must be at least 8 characters.";
}

export function validatePasswordsMatch(password, confirmPassword) {
  return password === confirmPassword
    ? null
    : "password and confirm password doesn't match each other";
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}
