import { NextResponse } from "next/server";
import { backendRequest, isBackendApiError, responseData } from "@/lib/api/backend.server";
import { clearSession, createSession, readSession } from "@/lib/auth/session.server";

interface RefreshPayload {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

/**
 * Keeps token rotation inside the BFF boundary. The response deliberately
 * contains no credential material, so client code cannot read or persist it.
 */
export async function POST() {
  const session = await readSession();
  if (session.status !== "authenticated") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Older API deployments issue only an access token. They remain usable for
  // the lifetime of the encrypted BFF session and simply skip rotation.
  if (!session.refreshToken) return new NextResponse(null, { status: 204 });

  try {
    const payload = responseData(
      await backendRequest<RefreshPayload>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      }),
    );
    const accessToken = payload.accessToken ?? payload.token;
    if (!accessToken) throw new Error("Refresh response did not include an access token.");

    await createSession({
      accessToken,
      refreshToken: payload.refreshToken ?? session.refreshToken,
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isBackendApiError(error) && error.status >= 500) {
      // Keep a still-valid local session during a transient backend outage.
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    await clearSession();
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
