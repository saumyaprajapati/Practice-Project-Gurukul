// Replaces the old lib/apiClient.js ApiError: Supabase/PostgREST errors are
// mapped onto the same HTTP-style statuses the /api routes used to return,
// so call sites can keep branching on error.status.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// SQLSTATEs raised by the RPC functions in supabase/phase5b-baas.sql, plus
// PostgREST's "no rows" code.
const STATUS_BY_CODE = {
  28000: 401,
  42501: 403,
  P0002: 404,
  PGRST116: 404,
  22023: 400,
  23505: 409,
};

export function toApiError(error, fallback = "Something went wrong. Please try again.") {
  return new ApiError(error?.message || fallback, STATUS_BY_CODE[error?.code] ?? 500);
}

export function unwrap({ data, error }) {
  if (error) throw toApiError(error);
  return data;
}
