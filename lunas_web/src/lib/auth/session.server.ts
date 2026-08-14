import "server-only";

import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  createSessionValue,
  decryptSessionValue,
  SESSION_DURATION_SECONDS,
  SESSION_HEADER_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session-crypto";

export type SessionState =
  | {
      status: "authenticated";
      accessToken: string;
      refreshToken?: string;
      accessTokenExpiresAt: number;
      expiresAt: number;
    }
  | { status: "missing" }
  | { status: "expired" }
  | { status: "invalid" };

export async function readSession(): Promise<SessionState> {
  // Proxy writes this request-only header after a successful token rotation so
  // the same render uses the fresh access token before the browser receives
  // the replacement encrypted cookie.
  const requestHeaders = await headers();
  const value = requestHeaders.get(SESSION_HEADER_NAME)
    ?? (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!value) return { status: "missing" };

  const claims = decryptSessionValue(value);
  if (!claims) return { status: "invalid" };
  if (claims.expiresAt <= Math.floor(Date.now() / 1000)) return { status: "expired" };
  return { status: "authenticated", ...claims };
}

export async function createSession({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken?: string;
}) {
  (await cookies()).set(
    SESSION_COOKIE_NAME,
    createSessionValue({ accessToken, refreshToken }),
    sessionCookieOptions(SESSION_DURATION_SECONDS),
  );
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
