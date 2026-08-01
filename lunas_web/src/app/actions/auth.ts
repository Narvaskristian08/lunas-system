"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession } from "@/lib/auth/session.server";
import { getMockUserByEmail, requireViewer } from "@/lib/auth/dal.server";
import { usersByRole } from "@/lib/mock-data";
import { isValidEmail, safeReturnPath, sleep } from "@/lib/utils";
import type { AuthFailureCode, UserRole } from "@/types";

export interface LoginActionState {
  status: "idle" | "error";
  message?: string;
  code?: AuthFailureCode;
  email?: string;
  fieldErrors?: { email?: string; password?: string };
}

const safeFailures: Record<AuthFailureCode, string> = {
  INVALID_CREDENTIALS: "The email or password is incorrect. Check your details and try again.",
  UNVERIFIED: "This account still needs verification before it can sign in.",
  SUSPENDED: "This account is temporarily suspended. Contact your system administrator.",
  DEACTIVATED: "This account is no longer active. Contact your system administrator.",
  RATE_LIMITED: "Too many sign-in attempts. Wait 15 minutes before trying again.",
  OFFLINE: "You appear to be offline. Reconnect and try again.",
  SERVER_UNAVAILABLE: "LUNAS is temporarily unavailable. Please try again shortly.",
  MAINTENANCE: "Sign-in is unavailable during scheduled maintenance.",
};

function scenarioFromEmail(email: string): AuthFailureCode | null {
  const local = email.split("@")[0]?.toLowerCase();
  if (local?.includes("unverified")) return "UNVERIFIED";
  if (local?.includes("suspended")) return "SUSPENDED";
  if (local?.includes("inactive")) return "DEACTIVATED";
  if (local?.includes("locked")) return "RATE_LIMITED";
  if (local?.includes("offline")) return "OFFLINE";
  if (local?.includes("server")) return "SERVER_UNAVAILABLE";
  if (local?.includes("maintenance")) return "MAINTENANCE";
  return null;
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeReturnPath(String(formData.get("next") ?? "/dashboard"));
  const fieldErrors: LoginActionState["fieldErrors"] = {};
  if (!email) fieldErrors.email = "Enter your authorized email address.";
  else if (!isValidEmail(email)) fieldErrors.email = "Enter an email in the format name@example.gov.ph.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Review the highlighted fields.", email, fieldErrors };
  }

  await sleep(750);
  const scenario = scenarioFromEmail(email);
  if (scenario) return { status: "error", code: scenario, message: safeFailures[scenario], email };

  const user = getMockUserByEmail(email);
  if (!user || password !== "LunasDemo!2026") {
    return {
      status: "error",
      code: "INVALID_CREDENTIALS",
      message: safeFailures.INVALID_CREDENTIALS,
      email,
    };
  }

  await createSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  await sleep(350);
  await clearSession();
}

export async function clearExpiredSessionAction() {
  await clearSession();
}

export async function switchDemoRoleAction(role: UserRole) {
  await requireViewer();
  const user = usersByRole[role];
  if (!user) return;
  await createSession(user.id);
}
