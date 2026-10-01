import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api/url";
import { validateWebServerEnvironment } from "@/lib/config/runtime";

export const dynamic = "force-dynamic";

function backendReadinessUrl() {
  return new URL("../../health/ready", `${apiBaseUrl()}/`).toString();
}

export async function GET() {
  try {
    validateWebServerEnvironment();
    const response = await fetch(backendReadinessUrl(), {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Backend readiness returned ${response.status}`);
    return NextResponse.json({ status: "ready", dependencies: { backend: "reachable" } });
  } catch {
    return NextResponse.json(
      { status: "not_ready", dependencies: { backend: "unreachable" } },
      { status: 503 },
    );
  }
}
