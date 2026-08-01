import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const SESSION_SECRET =
  process.env.LUNAS_SESSION_SECRET ?? "lunas-local-preview-secret-change-before-deployment";

interface SessionClaims {
  sub: string;
  iat: number;
  exp: number;
  version: 1;
}

export type SessionState =
  | { status: "authenticated"; userId: string }
  | { status: "missing" }
  | { status: "expired" }
  | { status: "invalid" };

function signature(payload: string) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function encodeClaims(claims: SessionClaims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function decodeClaims(value: string): SessionClaims | null {
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature) return null;
  const expected = signature(payload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionClaims;
    if (!claims.sub || claims.version !== 1 || !claims.exp) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionState> {
  const value = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!value) return { status: "missing" };
  const claims = decodeClaims(value);
  if (!claims) return { status: "invalid" };
  if (claims.exp <= Math.floor(Date.now() / 1000)) return { status: "expired" };
  return { status: "authenticated", userId: claims.sub };
}

export async function createSession(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const value = encodeClaims({
    sub: userId,
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
    version: 1,
  });
  (await cookies()).set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
