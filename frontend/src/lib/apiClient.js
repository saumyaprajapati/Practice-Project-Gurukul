// Small fetch wrapper for the app's own /api routes — no new dependency
// (plain fetch), matching this project's existing no-unnecessary-deps
// pattern. Always sends credentials so the httpOnly session cookie rides
// along, and throws a typed error with the response's status/message on
// any non-2xx so call sites can branch on it.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error ?? "Something went wrong. Please try again.", response.status);
  }

  return data;
}
