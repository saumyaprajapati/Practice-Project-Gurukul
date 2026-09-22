// Mock profile data + password-update service. There's no persisted user
// account anywhere in this prototype (AUTH-00 explicitly rules that out),
// so this is a static mock, isolated behind these functions the same way
// lib/courses/enrollment.js isolates its mock user — a real API can
// replace the bodies later without touching the Profile page.
const MOCK_PROFILE = {
  name: "Guest Learner",
  email: "learner@example.com",
};

export function getCurrentUserProfile() {
  return MOCK_PROFILE;
}

// Does not claim a server was contacted — always "succeeds" for any
// password that already passed validation in the caller.
export function updatePassword() {
  return { success: true };
}
