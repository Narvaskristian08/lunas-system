"use server";

import { revalidatePath } from "next/cache";
import { BackendApiError, backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import type { LunasNotification, NotificationCategory, Severity } from "@/types";

interface BackendNotification {
  _id?: string;
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  createdAt?: string;
  isRead?: boolean;
  priority?: string;
  data?: { incidentId?: string; workOrderId?: string; reportNumber?: string; workOrderNumber?: string; link?: string; destination?: string };
  resourceAvailable?: boolean;
}

function categoryFor(type = ""): NotificationCategory {
  if (type.startsWith("incident_")) return "Reports";
  if (type.startsWith("work_order_")) return "Work orders";
  if (type.startsWith("sla_")) return "SLA";
  if (type.includes("repair") || type.includes("correction")) return "Repairs";
  if (type.startsWith("account_") || type.includes("permission")) return "Security";
  return "System";
}

function severityFor(priority = "medium"): Severity {
  if (priority === "urgent") return "critical";
  if (priority === "high") return "warning";
  if (priority === "low") return "neutral";
  return "information";
}

function toNotification(source: BackendNotification, role: string): LunasNotification {
  const id = String(source.id ?? source._id ?? "");
  const workOrderId = source.data?.workOrderId;
  const incidentId = source.data?.incidentId;
  const text = `${source.title ?? ""} ${source.message ?? ""}`;
  const workOrderReference = source.data?.workOrderNumber ?? text.match(/\bWO-[A-Z0-9]+(?:-[A-Z0-9]+)+\b/i)?.[0];
  const reportReference = source.data?.reportNumber ?? text.match(/\b(?:LUNAS|MOCK-WEB|DEMO-QA)-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/i)?.[0];
  const relatedRecord = source.resourceAvailable === false ? undefined : workOrderId
    ? { type: "work-order" as const, id: workOrderId, reference: workOrderReference, label: "Work Order", href: `/work-orders/${encodeURIComponent(workOrderId)}`, available: true }
    : incidentId
      ? {
          type: "incident" as const,
          id: incidentId,
          reference: reportReference,
          label: "Incident",
          href: role === "utility_provider" ? `/work-orders/intake/${encodeURIComponent(incidentId)}` : role === "barangay_official" ? `/validation-routing/${encodeURIComponent(incidentId)}` : undefined,
          available: ["barangay_official", "utility_provider"].includes(role),
          restricted: !["barangay_official", "utility_provider"].includes(role),
        }
      : undefined;
  return {
    id,
    category: categoryFor(source.type),
    title: source.title ?? "LUNAS notification",
    message: source.message ?? "",
    fullMessage: source.message ?? "",
    timestamp: source.createdAt ?? new Date(0).toISOString(),
    read: Boolean(source.isRead),
    severity: severityFor(source.priority),
    source: "LUNAS",
    relatedRecord,
  };
}

async function auth() {
  const viewer = await requirePermission("notifications.view");
  return { viewer, accessToken: await requireAccessToken() };
}

export async function listNotificationsAction(filters: { page?: number; limit?: number; category?: string; search?: string; readState?: string; dateRange?: string; sort?: string } = {}) {
  const { viewer, accessToken } = await auth();
  const query = new URLSearchParams({ page: String(filters.page ?? 1), limit: String(filters.limit ?? 20) });
  for (const key of ['category', 'search', 'dateRange', 'sort'] as const) if (filters[key] && filters[key] !== 'all') query.set(key, filters[key]);
  if (filters.readState === 'read' || filters.readState === 'unread') query.set('isRead', String(filters.readState === 'read'));
  const response = await backendRequest<BackendNotification[]>(`/notifications?${query}`, { accessToken });
  const metadata = response as typeof response & { pagination?: { total: number; pages: number }; unreadCount?: number };
  return { items: responseData(response).map(notification => toNotification(notification, viewer.backendRole)), total: metadata.pagination?.total ?? 0, unreadCount: metadata.unreadCount ?? 0 };
}

export async function getNotificationAction(id: string): Promise<LunasNotification | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const { viewer, accessToken } = await auth();
  try {
    const notification = responseData(await backendRequest<BackendNotification>(`/notifications/${encodeURIComponent(id)}`, { accessToken }));
    return toNotification(notification, viewer.backendRole);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) return null;
    throw error;
  }
}

export async function markNotificationsReadAction(ids: string[]): Promise<void> {
  const safeIds = [...new Set(ids.filter((id) => /^[a-f\d]{24}$/i.test(id)))];
  if (!safeIds.length) return;
  const { accessToken } = await auth();
  await Promise.all(safeIds.map((id) => backendRequest(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PUT", accessToken, body: JSON.stringify({}),
  })));
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const { accessToken } = await auth();
  await backendRequest("/notifications/read-all", { method: "PUT", accessToken, body: JSON.stringify({}) });
  revalidatePath("/notifications");
}
