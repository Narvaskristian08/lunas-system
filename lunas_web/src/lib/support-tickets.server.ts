import "server-only";

import { backendRequest, responseData } from "@/lib/api/backend.server";

export type SupportTicketCategory = "bug" | "account_access" | "data_issue" | "feature_request" | "other";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  requester?: { id?: string; name?: string; email?: string; role?: string };
  category: SupportTicketCategory;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  adminResponse?: string;
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  lastRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketPage {
  records: SupportTicket[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface SupportTicketEnvelope {
  data?: SupportTicket[];
  pagination?: SupportTicketPage["pagination"];
}

function pageResult(response: SupportTicketEnvelope, fallbackLimit: number): SupportTicketPage {
  const records = response.data ?? [];
  return {
    records,
    pagination: response.pagination ?? { page: 1, limit: fallbackLimit, total: records.length, pages: records.length ? 1 : 0 },
  };
}

export async function getMySupportTickets(accessToken: string, page = 1): Promise<SupportTicketPage> {
  const query = new URLSearchParams({ page: String(Math.max(1, page)), limit: "10" });
  const response = await backendRequest<SupportTicket[]>(`/support-tickets/mine?${query}`, { accessToken });
  return pageResult(response, 10);
}

export async function getAdminSupportTickets(
  accessToken: string,
  filters: { page?: number; status?: SupportTicketStatus | ""; category?: SupportTicketCategory | "" } = {},
): Promise<SupportTicketPage> {
  const query = new URLSearchParams({ page: String(Math.max(1, filters.page ?? 1)), limit: "10" });
  if (filters.status) query.set("status", filters.status);
  if (filters.category) query.set("category", filters.category);
  const response = await backendRequest<SupportTicket[]>(`/support-tickets?${query}`, { accessToken });
  return pageResult(response, 10);
}

export async function getSupportTicket(accessToken: string, id: string): Promise<SupportTicket> {
  return responseData(await backendRequest<SupportTicket>(`/support-tickets/${encodeURIComponent(id)}`, { accessToken }));
}
