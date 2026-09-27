import "server-only";

import { backendRequest } from "@/lib/api/backend.server";

export interface AuditActor {
  type: "user" | "anonymous" | "system";
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  label?: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actor: AuditActor;
  affectedUser?: AuditActor;
  source: "web" | "mobile" | "api" | "system";
  status: "success" | "failure" | "warning";
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogPage {
  records: AuditLogRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface AuditLogEnvelope {
  success?: boolean;
  data?: AuditLogRecord[];
  pagination?: AuditLogPage["pagination"];
}

export async function getAuditLogs(
  accessToken: string,
  filters: { action?: string; status?: string; source?: string; page?: string } = {},
): Promise<AuditLogPage> {
  const query = new URLSearchParams({ limit: "50" });
  if (filters.action) query.set("action", filters.action);
  if (filters.status) query.set("status", filters.status);
  if (filters.source) query.set("source", filters.source);
  if (filters.page) query.set("page", filters.page);

  const response = await backendRequest<AuditLogRecord[]>(`/audit-logs?${query}`, { accessToken }) as AuditLogEnvelope;
  return {
    records: response.data ?? [],
    pagination: response.pagination ?? { page: 1, limit: 50, total: 0, pages: 0 },
  };
}
