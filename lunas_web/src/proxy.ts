import { NextResponse, type NextRequest } from "next/server";
import { apiEndpoint } from "@/lib/api/url";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { workspaceRedirect } from "@/lib/auth/route-policy";
import { roleLabels } from "@/lib/permissions";
import type { BackendUserRole } from "@/types";
import {
  createSessionValue,
  decryptSessionValue,
  isSessionExpired,
  SESSION_HEADER_NAME,
  SESSION_REFRESH_UNAVAILABLE_HEADER,
  sessionCookieOptions,
  shouldRefreshAccessToken,
} from "@/lib/auth/session-crypto";

const protectedPrefixes = [
  "/repair-personnel",
  "/dashboard",
  "/notifications",
  "/profile",
  "/help",
  "/unauthorized",
  "/reports",
  "/incidents",
  "/work-orders",
  "/validation-routing",
  "/analytics",
  "/repairs",
  "/admin",
  "/maintenance-coordination",
  "/sla",
  "/recovery-email",
];

const requestPathHeader = "x-lunas-request-path";

interface RefreshPayload {
  success?: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;
  };
}

async function rotateAccessToken(refreshToken: string) {
  try {
    const response = await fetch(apiEndpoint("/auth/refresh"), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return { kind: response.status === 401 ? "invalid" as const : "unavailable" as const };
    const payload = await response.json() as RefreshPayload;
    const accessToken = payload.data?.accessToken ?? payload.data?.token;
    if (!accessToken) return { kind: "invalid" as const };
    return {
      kind: "success" as const,
      accessToken,
      refreshToken: payload.data?.refreshToken ?? refreshToken,
    };
  } catch {
    return { kind: "unavailable" as const };
  }
}

function sessionExpired(request: NextRequest, reason: "expired" | "invalid" | "revoked") {
  const url = new URL("/session-expired", request.url);
  url.searchParams.set("reason", reason);
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsSession = path === "/" || protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (needsSession && process.env.LUNAS_MAINTENANCE_MODE === "full") {
    const maintenance = new URL("/maintenance", request.url);
    maintenance.searchParams.set("mode", "full");
    return NextResponse.redirect(maintenance);
  }
  if (!needsSession) return NextResponse.next();

  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  const session = decryptSessionValue(cookieValue);
  if (!session) return sessionExpired(request, "invalid");
  if (isSessionExpired(session)) return sessionExpired(request, "expired");

  // Remove any inbound value for this internal header. Only Proxy can place a
  // rotated encrypted session onto the request consumed by Server Components.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(SESSION_HEADER_NAME);
  requestHeaders.delete(SESSION_REFRESH_UNAVAILABLE_HEADER);
  requestHeaders.delete(requestPathHeader);
  requestHeaders.set(requestPathHeader, `${path}${request.nextUrl.search}`);
  let rotatedCookie: string | undefined;

  if (shouldRefreshAccessToken(session)) {
    const refreshed = await rotateAccessToken(session.refreshToken!);
    if (refreshed.kind === "invalid") return sessionExpired(request, "expired");
    if (refreshed.kind === "success") {
      const refreshedCookie = createSessionValue({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
      });
      requestHeaders.set(SESSION_HEADER_NAME, refreshedCookie);
      session.accessToken = refreshed.accessToken;
      rotatedCookie = refreshedCookie;
    }
    // If rotation temporarily fails, preserve the session and let the route
    // render its ordinary safe unavailable state rather than signing out.
    if (refreshed.kind === "unavailable") requestHeaders.set(SESSION_REFRESH_UNAVAILABLE_HEADER, "1");
  }

  // Resolve navigation redirects before React starts streaming. Rendering a
  // redirect in the installed App Router runtime can otherwise hit error #310.
  // The DAL and API remain the authorization boundary, including Server Actions.
  let response: NextResponse | undefined;
  if (["GET", "HEAD"].includes(request.method) && !requestHeaders.has(SESSION_REFRESH_UNAVAILABLE_HEADER)) {
    try {
      const options = { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: "no-store" as const, signal: AbortSignal.timeout(8000) };
      let viewerResponse = await fetch(apiEndpoint("/users/me"), options);
      if (viewerResponse.status === 404) viewerResponse = await fetch(apiEndpoint("/auth/me"), options);
      if ([401, 403].includes(viewerResponse.status)) response = sessionExpired(request, "revoked");
      else if (viewerResponse.ok) {
        const payload = await viewerResponse.json();
        const user = payload.data;
        if (user?.isActive === false) response = sessionExpired(request, "revoked");
        else if (user?.role && Object.hasOwn(roleLabels, user.role)) {
          const target = workspaceRedirect(path, request.nextUrl.search, user.role as BackendUserRole);
          if (target) response = NextResponse.redirect(new URL(target, request.url));
          else if (user.role === "utility_provider" && /^\/work-orders\/intake\/[a-f\d]{24}$/i.test(path)) {
            const incidentId = path.split("/").at(-1)!;
            const incidentResponse = await fetch(apiEndpoint(`/incidents/${incidentId}`), options);
            if (incidentResponse.ok) {
              const incident = (await incidentResponse.json()).data;
              const workOrderId = incident?.workOrder?.id ?? incident?.workOrder?._id;
              if (typeof workOrderId === "string" && /^[a-f\d]{24}$/i.test(workOrderId)) {
                response = NextResponse.redirect(new URL(`/work-orders/${workOrderId}`, request.url));
              }
            }
          }
        }
      }
    } catch {
      // The page's ordinary server-side unavailable state handles API failures.
    }
  }
  response ??= NextResponse.next({ request: { headers: requestHeaders } });
  if (rotatedCookie) response.cookies.set(SESSION_COOKIE_NAME, rotatedCookie, sessionCookieOptions());
  return response;
}

export const config = {
  matcher: [
    "/",
    "/repair-personnel/:path*",
    "/dashboard/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/help/:path*",
    "/unauthorized/:path*",
    "/reports/:path*",
    "/incidents/:path*",
    "/work-orders/:path*",
    "/validation-routing/:path*",
    "/analytics/:path*",
    "/repairs/:path*",
    "/admin/:path*",
    "/maintenance-coordination/:path*",
    "/sla/:path*",
    "/recovery-email/:path*",
  ],
};
