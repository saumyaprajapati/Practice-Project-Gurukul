// Admin user management — list, rename, roles, ban/unban, permanent delete.
// All via admin-only RPCs (supabase/phase6-admin.sql), which also enforce the
// "can't demote/ban/delete yourself or another admin" guard rails.
import { getSupabase } from "@/lib/supabase/client";
import { unwrap } from "@/lib/supabase/errors";

export async function getAllUsers() {
  const rows = unwrap(await getSupabase().rpc("admin_list_users"));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    lastSignInAt: row.last_sign_in_at,
    emailConfirmed: row.email_confirmed,
    isInstructor: row.is_instructor,
    isAdmin: row.is_admin,
    isBanned: row.is_banned,
    enrollmentCount: Number(row.enrollment_count),
    courseCount: Number(row.course_count),
  }));
}

// One user for the admin profile page, or null. Reuses admin_list_users()
// (fine at this app's size — add an admin_get_user(uuid) RPC if it grows).
export async function getUserForAdmin(userId) {
  const users = await getAllUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function updateUser(userId, { name, isInstructor, isAdmin }) {
  unwrap(
    await getSupabase().rpc("admin_update_user", {
      p_user_id: userId,
      p_name: name,
      p_is_instructor: isInstructor,
      p_is_admin: isAdmin,
    })
  );
}

export async function setUserBanned(userId, banned) {
  unwrap(await getSupabase().rpc("admin_set_user_banned", { p_user_id: userId, p_banned: banned }));
}

export async function deleteUser(userId) {
  unwrap(await getSupabase().rpc("admin_delete_user", { p_user_id: userId }));
}
