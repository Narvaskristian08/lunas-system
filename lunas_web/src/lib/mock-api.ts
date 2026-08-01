import { notifications } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";
import type { LunasNotification, UserProfile } from "@/types";

export interface ServiceResult<T> {
  data: T;
  requestId: string;
}

function requestId() {
  return `LNS-${Date.now().toString(36).toUpperCase()}`;
}

async function mockRequest<T>(factory: () => T, delay = 650): Promise<ServiceResult<T>> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("OFFLINE");
  }
  await sleep(delay);
  return { data: factory(), requestId: requestId() };
}

export const notificationService = {
  list: () => mockRequest(() => structuredClone(notifications)),
  get: (id: string) =>
    mockRequest<LunasNotification | null>(() => {
      const item = notifications.find((notification) => notification.id === id);
      return item ? structuredClone(item) : null;
    }),
  markRead: (ids: string[]) => mockRequest(() => ({ updated: ids.length }), 400),
  markAllRead: () => mockRequest(() => ({ updated: notifications.length }), 500),
};

export const profileService = {
  update: (viewer: UserProfile, changes: Partial<UserProfile>) =>
    mockRequest(() => ({ ...viewer, ...changes }), 850),
  changePassword: () => mockRequest(() => ({ sessionsRevoked: true }), 900),
};

export const supportService = {
  submit: (payload: Record<string, string>) =>
    mockRequest(
      () => ({ ticketId: "SUP-2026-0186", receivedAt: new Date().toISOString(), payload }),
      950,
    ),
};

export const accountService = {
  requestPasswordReset: (email: string) => {
    void email;
    return mockRequest(() => ({ accepted: true, retryAfterSeconds: 30 }), 800);
  },
  resetPassword: (token: string, password: string) => {
    void token;
    void password;
    return mockRequest(() => ({ reset: true }), 900);
  },
  verifyAccount: (code: string) => {
    void code;
    return mockRequest(() => ({ verified: true }), 850);
  },
  resendVerification: () => mockRequest(() => ({ accepted: true, retryAfterSeconds: 30 }), 750),
};

/*
 * FastAPI integration boundary. Replace each mockRequest with the shared HTTP client:
 * POST /api/v1/auth/login, /auth/forgot-password, /auth/reset-password, /auth/verify
 * GET/PATCH /api/v1/users/me, POST /api/v1/users/me/change-password
 * GET/PATCH /api/v1/notifications, POST /api/v1/support/tickets
 */
