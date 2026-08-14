"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backendRequest, isBackendApiError, responseData } from "@/lib/api/backend.server";
import { clearSession, createSession, readSession } from "@/lib/auth/session.server";
import { isValidEmail, safeReturnPath } from "@/lib/utils";
import type { AuthFailureCode } from "@/types";

export interface LoginActionState {
  status: "idle" | "error";
  message?: string;
  code?: AuthFailureCode;
  email?: string;
  fieldErrors?: { email?: string; password?: string };
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  retryAfterSeconds?: number;
  code?: "invalid" | "expired" | "unavailable";
}

interface LoginPayload {
  accessToken?: string;
  refreshToken?: string;
  // Retained only for compatibility with the currently deployed API while it
  // rolls out the explicit accessToken field.
  token?: string;
}

interface PasswordChangePayload {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

const safeFailures: Record<AuthFailureCode, string> = {
  INVALID_CREDENTIALS: "The email or password is incorrect. Check your details and try again.",
  UNVERIFIED: "This account still needs verification before it can sign in.",
  SUSPENDED: "This account is temporarily suspended. Contact your system administrator.",
  DEACTIVATED: "This account is no longer active. Contact your system administrator.",
  RATE_LIMITED: "Too many sign-in attempts. Wait a few minutes before trying again.",
  OFFLINE: "You appear to be offline. Reconnect and try again.",
  SERVER_UNAVAILABLE: "LUNAS is temporarily unavailable. Please try again shortly.",
  MAINTENANCE: "Sign-in is unavailable during scheduled maintenance.",
};

function authenticationFailure(error: unknown): Pick<LoginActionState, "code" | "message"> {
  if (!isBackendApiError(error)) {
    return { code: "SERVER_UNAVAILABLE", message: safeFailures.SERVER_UNAVAILABLE };
  }
  if (error.status === 429) return { code: "RATE_LIMITED", message: safeFailures.RATE_LIMITED };
  if (error.status >= 500) return { code: "SERVER_UNAVAILABLE", message: safeFailures.SERVER_UNAVAILABLE };

  const serverMessage = error.message.toLowerCase();
  if (serverMessage.includes("deactivat")) {
    return { code: "DEACTIVATED", message: safeFailures.DEACTIVATED };
  }
  if (serverMessage.includes("suspend")) {
    return { code: "SUSPENDED", message: safeFailures.SUSPENDED };
  }
  if (serverMessage.includes("verif")) {
    return { code: "UNVERIFIED", message: safeFailures.UNVERIFIED };
  }
  return { code: "INVALID_CREDENTIALS", message: safeFailures.INVALID_CREDENTIALS };
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
  else if (!isValidEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Enter your password.";
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Review the highlighted fields.", email, fieldErrors };
  }

  try {
    const payload = responseData(
      await backendRequest<LoginPayload>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, platform: "web" }),
      }),
    );
    const accessToken = payload.accessToken ?? payload.token;
    if (!accessToken) {
      return {
        status: "error",
        code: "SERVER_UNAVAILABLE",
        message: safeFailures.SERVER_UNAVAILABLE,
        email,
      };
    }

    await createSession({ accessToken, refreshToken: payload.refreshToken });
  } catch (error) {
    return { status: "error", email, ...authenticationFailure(error) };
  }

  redirect(next);
}

export async function logoutAction() {
  const session = await readSession();
  try {
    if (session.status === "authenticated") {
      await backendRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
        accessToken: session.accessToken,
      });
    }
  } catch {
    // Local session removal still matters if the API is unreachable. The API
    // access token is short-lived and is never exposed to the browser.
  } finally {
    await clearSession();
  }
}

export async function clearExpiredSessionAction() {
  await clearSession();
}

export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<ActionResult> {
  const session = await readSession();
  if (session.status !== "authenticated") {
    return { ok: false, message: "Your session has ended. Sign in again before saving changes." };
  }

  const body = JSON.stringify({
    firstName: input.firstName,
    lastName: input.lastName,
    ...(input.phone ? { phone: input.phone } : {}),
  });

  try {
    try {
      await backendRequest("/users/me", {
        method: "PATCH",
        body,
        accessToken: session.accessToken,
      });
    } catch (error) {
      // Existing deployments use /auth/profile. The fallback can be removed
      // after all environments have the narrowed /users/me endpoint.
      if (!isBackendApiError(error) || error.status !== 404) throw error;
      await backendRequest("/auth/profile", {
        method: "PUT",
        body,
        accessToken: session.accessToken,
      });
    }
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (isBackendApiError(error) && [401, 403].includes(error.status)) {
      return { ok: false, message: "Your session has ended. Sign in again before saving changes." };
    }
    return { ok: false, message: "We couldn’t save your profile. Your changes are still here; try again in a moment." };
  }
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const session = await readSession();
  if (session.status !== "authenticated") {
    return { ok: false, message: "Your session has ended. Sign in again before changing your password." };
  }

  try {
    const response = await backendRequest<PasswordChangePayload>("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(input),
      accessToken: session.accessToken,
    });
    // The current API revokes the old token version and returns a new pair.
    // Rotate the encrypted BFF session in the same Server Action so the user
    // remains signed in with the replacement credentials. Older deployments
    // return no token pair and retain the current token, which is also safe.
    const accessToken = response.data?.accessToken ?? response.data?.token;
    if (accessToken) {
      await createSession({
        accessToken,
        refreshToken: response.data?.refreshToken ?? session.refreshToken,
      });
    }
    return { ok: true };
  } catch (error) {
    if (isBackendApiError(error) && error.status === 401) {
      return { ok: false, message: "Your current password is incorrect." };
    }
    return { ok: false, message: "We couldn’t change your password. Try again in a moment." };
  }
}

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  try {
    const result = await backendRequest<{ retryAfterSeconds?: number }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { ok: true, retryAfterSeconds: result.data?.retryAfterSeconds ?? 30 };
  } catch {
    // Do not expose account existence or email-provider details from this
    // public action. A retryable service failure is all the browser needs.
    return { ok: false, message: "The password reset service is temporarily unavailable." };
  }
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResult> {
  try {
    await backendRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password: newPassword }),
    });
    return { ok: true };
  } catch (error) {
    if (isBackendApiError(error) && error.status === 400) {
      const message = error.message.toLowerCase();
      return { ok: false, code: message.includes("expire") ? "expired" : "invalid" };
    }
    return { ok: false, code: "unavailable", message: "The password reset service is temporarily unavailable." };
  }
}

export async function verifyAccountAction(code: string): Promise<ActionResult> {
  try {
    await backendRequest("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return { ok: true };
  } catch (error) {
    if (isBackendApiError(error) && error.status === 404) {
      return { ok: false, code: "unavailable", message: "Online account verification is not configured yet." };
    }
    if (isBackendApiError(error) && error.status === 400) {
      return { ok: false, code: error.message.toLowerCase().includes("expire") ? "expired" : "invalid" };
    }
    return { ok: false, code: "unavailable", message: "The verification service is temporarily unavailable." };
  }
}

export async function resendVerificationAction(email?: string): Promise<ActionResult> {
  try {
    const result = responseData<{ retryAfterSeconds?: number }>(
      await backendRequest("/auth/verification/resend", {
        method: "POST",
        body: JSON.stringify(email ? { email } : {}),
      }),
    );
    return { ok: true, retryAfterSeconds: result.retryAfterSeconds ?? 30 };
  } catch {
    return { ok: false, code: "unavailable", message: "The verification service is temporarily unavailable." };
  }
}
