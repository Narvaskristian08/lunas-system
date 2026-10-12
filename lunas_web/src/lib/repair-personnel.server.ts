import "server-only";

import { backendRequest, responseData } from "@/lib/api/backend.server";

export type RepairPersonnelAccountStatus = "pending_activation" | "active" | "suspended" | "deactivated";

export interface RepairPersonnelRecord {
  id: string;
  version: number;
  firstName: string;
  middleName?: string;
  suffix?: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  repairOrganization?: string;
  repairTeam?: string;
  repairAccountType?: "individual" | "team";
  availability?: "available" | "assigned" | "unavailable" | "off_duty";
  barangay?: string;
  accountStatus: RepairPersonnelAccountStatus;
  isActive: boolean;
  requiresActivation?: boolean;
  createdAt?: string;
}

interface RepairPersonnelEnvelope {
  data?: RepairPersonnelRecord[];
  count?: number;
}

export async function getRepairPersonnel(accessToken: string): Promise<RepairPersonnelRecord[]> {
  const payload = responseData(await backendRequest<RepairPersonnelEnvelope | RepairPersonnelRecord[]>("/users/repair-personnel", { accessToken }));
  return Array.isArray(payload) ? payload : payload.data ?? [];
}
