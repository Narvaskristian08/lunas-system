/**
 * Server-side API base URL. In Docker, use LUNAS_API_URL=http://backend:5000/api/v1.
 * NEXT_PUBLIC_API_URL is intentionally only a fallback for browser-facing code
 * that may be added later; server integration should prefer LUNAS_API_URL.
 */
export function apiBaseUrl() {
  const configured = process.env.LUNAS_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const base = (configured || "http://localhost:5000/api/v1").replace(/\/+$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
}

export function apiEndpoint(path: string) {
  return new URL(path.replace(/^\//, ""), `${apiBaseUrl()}/`).toString();
}
