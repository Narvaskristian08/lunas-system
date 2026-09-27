import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const MFA_COOKIE_NAME = "lunas_privileged_mfa";

export interface PendingPrivilegedMfa {
  email: string;
  challengeToken: string;
  expiresAt: number;
  resendAvailableAt: number;
  next: string;
  developmentCode?: string;
}

function key() {
  const secret = process.env.LUNAS_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("LUNAS_SESSION_SECRET must be configured in production.");
  }
  return createHash("sha256")
    .update(`${secret ?? "lunas-local-development-session-secret"}:privileged-mfa`)
    .digest();
}

function encode(value: Buffer) {
  return value.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url");
}

function encrypt(claims: PendingPrivilegedMfa) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), initializationVector);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(claims), "utf8"),
    cipher.final(),
  ]);
  return ["m1", encode(initializationVector), encode(ciphertext), encode(cipher.getAuthTag())].join(".");
}

function decrypt(value: string | undefined): PendingPrivilegedMfa | null {
  if (!value) return null;
  const [version, initializationVector, ciphertext, authTag] = value.split(".");
  if (version !== "m1" || !initializationVector || !ciphertext || !authTag) return null;

  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), decode(initializationVector));
    decipher.setAuthTag(decode(authTag));
    const plaintext = Buffer.concat([decipher.update(decode(ciphertext)), decipher.final()]);
    const claims = JSON.parse(plaintext.toString("utf8")) as PendingPrivilegedMfa;
    if (
      !claims.email
      || !claims.challengeToken
      || !Number.isFinite(claims.expiresAt)
      || !Number.isFinite(claims.resendAvailableAt)
      || claims.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null;
    return claims;
  } catch {
    return null;
  }
}

export async function savePendingPrivilegedMfa(input: {
  email: string;
  challengeToken: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
  next: string;
  developmentCode?: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = Math.max(1, Math.min(input.expiresInSeconds, 15 * 60));
  const claims: PendingPrivilegedMfa = {
    email: input.email,
    challengeToken: input.challengeToken,
    expiresAt: now + expiresInSeconds,
    resendAvailableAt: now + Math.max(0, input.resendAfterSeconds),
    next: input.next,
    developmentCode: input.developmentCode,
  };
  (await cookies()).set(MFA_COOKIE_NAME, encrypt(claims), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: expiresInSeconds,
    priority: "high",
  });
}

export async function readPendingPrivilegedMfa() {
  const claims = decrypt((await cookies()).get(MFA_COOKIE_NAME)?.value);
  if (!claims) return null;
  return {
    ...claims,
    resendAfterSeconds: Math.max(
      0,
      claims.resendAvailableAt - Math.floor(Date.now() / 1000),
    ),
  };
}

export async function clearPendingPrivilegedMfa() {
  (await cookies()).delete(MFA_COOKIE_NAME);
}
