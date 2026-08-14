import "server-only";

import { apiEndpoint } from "@/lib/api/url";

/**
 * Server-only client for the established LUNAS REST API.  Keeping this at the
 * Next.js boundary means backend access and refresh tokens never need to be
 * exposed to browser JavaScript.
 */
export class BackendApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message?: string }>;
}

function messageFromPayload(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const candidate = payload as ApiEnvelope<unknown>;
  if (typeof candidate.message === "string" && candidate.message.trim()) return candidate.message;
  const firstFieldError = candidate.errors?.find((error) => error.message)?.message;
  return firstFieldError || fallback;
}

async function parsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function backendRequest<T>(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<ApiEnvelope<T>> {
  const { accessToken, headers, ...requestInit } = init;
  let response: Response;

  try {
    response = await fetch(apiEndpoint(path), {
      ...requestInit,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(requestInit.body && !(requestInit.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new BackendApiError(503, "The LUNAS service could not be reached.");
  }

  const payload = await parsePayload(response);
  if (!response.ok) {
    throw new BackendApiError(
      response.status,
      messageFromPayload(payload, "The LUNAS service could not complete this request."),
      payload,
    );
  }

  return (payload ?? {}) as ApiEnvelope<T>;
}

export function responseData<T>(response: ApiEnvelope<T>): T {
  if (response.data === undefined || response.data === null) {
    throw new BackendApiError(502, "The LUNAS service returned an incomplete response.", response);
  }
  return response.data;
}

export function isBackendApiError(error: unknown): error is BackendApiError {
  return error instanceof BackendApiError;
}
