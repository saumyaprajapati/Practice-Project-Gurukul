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

export function getPostAuthDestination() {
  return POST_AUTH_DESTINATION;
}
