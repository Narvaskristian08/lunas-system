import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const protectedPrefixes = [
  "/dashboard",
  "/notifications",
  "/profile",
  "/help",
  "/unauthorized",
];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsSession = protectedPrefixes.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (needsSession && process.env.LUNAS_MAINTENANCE_MODE === "full") {
    const maintenance = new URL("/maintenance", request.url);
    maintenance.searchParams.set("mode", "full");
    return NextResponse.redirect(maintenance);
  }
  if (!needsSession || request.cookies.has(SESSION_COOKIE_NAME)) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${path}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/help/:path*",
    "/unauthorized/:path*",
  ],
};
