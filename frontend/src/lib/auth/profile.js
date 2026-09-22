import { apiFetch } from "@/lib/apiClient";

export async function getCurrentUserProfile() {
  const data = await apiFetch("/api/profile");
  return data.user;
}

export async function becomeInstructor() {
  await apiFetch("/api/profile/become-instructor", { method: "POST" });
}

export async function updatePassword(currentPassword, newPassword, confirmNewPassword) {
  try {
    await apiFetch("/api/profile/password", {
      method: "PATCH",
      body: { currentPassword, newPassword, confirmNewPassword },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
