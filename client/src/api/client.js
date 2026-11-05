const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Request to `${VITE_API_URL}/api${path}`. Pass `token` for staff routes.
// `body` is sent as JSON, or as multipart if it is a FormData (file upload):
// then the browser sets Content-Type itself, because it must add the boundary.
export async function request(path, { method = "GET", body, token } = {}) {
  const isFormData = body instanceof FormData;
  const headers = {};
  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined || isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.message ?? "Request failed",
      data?.error?.details ?? [],
    );
  }
  return data;
}
