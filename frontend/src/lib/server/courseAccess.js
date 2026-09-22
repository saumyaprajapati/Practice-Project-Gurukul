import "server-only";
import { getAuthenticatedUser } from "./auth";
import { getUserRoles } from "./roles";

// A pending/declined course is only visible to its own owner or an admin.
// Callers should only invoke this for a course whose status isn't
// "approved" — approved courses are always visible, no check needed.
export async function canViewUnapprovedCourse(ownerId) {
  const session = await getAuthenticatedUser();
  if (!session) return false;
  if (session.userId === ownerId) return true;
  const { isAdmin } = await getUserRoles(session.userId);
  return isAdmin;
}
