/**
 * Server-side API base URL. In Docker, use LUNAS_API_URL=http://backend:5000/api/v1.
 * NEXT_PUBLIC_API_URL is intentionally not used here: public variables are
 * browser-facing build-time configuration, while the BFF must use its private
 * runtime URL (for Docker, the backend service name rather than localhost).
 */
export function apiBaseUrl() {
  const configured = process.env.LUNAS_API_URL;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("LUNAS_API_URL must be configured in production.");
  }
  const base = (configured || "http://localhost:5000/api/v1").replace(/\/+$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

export function apiEndpoint(path: string) {
  return new URL(path.replace(/^\//, ""), `${apiBaseUrl()}/`).toString();
}
