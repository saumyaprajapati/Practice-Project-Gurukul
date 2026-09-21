// Single source of truth for auth route paths and the post-auth destination.
export const AUTH_ROUTES = {
  signup: "/auth/signup",
  login: "/auth/login",
  recovery: "/auth/recovery",
  code: "/auth/code",
};

// No real dashboard exists yet — change only this line to redirect to
// "/dashboard" once one does.
const POST_AUTH_DESTINATION = "/";

export function getPostAuthDestination() {
  return POST_AUTH_DESTINATION;
}
