import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const SESSION_DURATION_SECONDS = 60 * 60 * 8;
export const SESSION_VERSION = 2;
export const SESSION_HEADER_NAME = "x-lunas-bff-session";
export const SESSION_REFRESH_UNAVAILABLE_HEADER = "x-lunas-session-refresh-unavailable";

interface SessionClaims {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: number;
  iat: number;
  exp: number;
  version: typeof SESSION_VERSION;
}

export type DecryptedSession = {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: number;
  expiresAt: number;
};

function getSessionKey() {
  const secret = process.env.LUNAS_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("LUNAS_SESSION_SECRET must be configured in production.");
  }
  return createHash("sha256")
    .update(secret ?? "lunas-local-development-session-secret")
    .digest();
}

function encode(value: Buffer) {
  return value.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

function accessTokenExpiry(accessToken: string, fallback: number) {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return fallback;
    const parsed = JSON.parse(decode(payload).toString("utf8")) as { exp?: unknown };
    const expiration = typeof parsed.exp === "number" ? parsed.exp : Number(parsed.exp);
    return Number.isFinite(expiration) && expiration > 0 ? expiration : fallback;
  } catch {
    return fallback;
  }
}

export function createSessionValue({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken?: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + SESSION_DURATION_SECONDS;
  // Without a JWT exp claim, an API without refresh-token support should keep
  // the token for the local BFF-session lifetime. Refresh-enabled APIs get a
  // conservative expiry so Proxy asks for rotation before a stale token is used.
  const fallbackTokenExpiry = refreshToken ? now + 10 * 60 : exp;
  const claims: SessionClaims = {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: accessTokenExpiry(accessToken, fallbackTokenExpiry),
    iat: now,
    exp,
    version: SESSION_VERSION,
  };
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getSessionKey(), initializationVector);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(claims), "utf8"), cipher.final()]);
  return ["v2", encode(initializationVector), encode(ciphertext), encode(cipher.getAuthTag())].join(".");
}

export function decryptSessionValue(value: string | undefined): DecryptedSession | null {
  if (!value) return null;
  const [version, initializationVector, ciphertext, authTag] = value.split(".");
  if (version !== "v2" || !initializationVector || !ciphertext || !authTag) return null;

  try {
    const decipher = createDecipheriv("aes-256-gcm", getSessionKey(), decode(initializationVector));
    decipher.setAuthTag(decode(authTag));
    const decrypted = Buffer.concat([decipher.update(decode(ciphertext)), decipher.final()]);
    const claims = JSON.parse(decrypted.toString("utf8")) as SessionClaims;
    if (
      claims.version !== SESSION_VERSION ||
      !claims.accessToken ||
      !Number.isFinite(claims.exp) ||
      !Number.isFinite(claims.iat) ||
      !Number.isFinite(claims.accessTokenExpiresAt)
    ) {
      return null;
    }
    return {
      accessToken: claims.accessToken,
      refreshToken: claims.refreshToken,
      accessTokenExpiresAt: claims.accessTokenExpiresAt,
      expiresAt: claims.exp,
    };
  } catch {
    return null;
  }
}

export function isSessionExpired(session: DecryptedSession, now = Math.floor(Date.now() / 1000)) {
  return session.expiresAt <= now;
}

export function shouldRefreshAccessToken(session: DecryptedSession, now = Math.floor(Date.now() / 1000)) {
  return Boolean(session.refreshToken) && session.accessTokenExpiresAt <= now + 60;
}

export function sessionCookieOptions(maxAge = SESSION_DURATION_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high" as const,
  };
}
