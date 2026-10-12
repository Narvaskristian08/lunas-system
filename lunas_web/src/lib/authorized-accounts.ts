import type { BackendUserRole } from "@/types";

export type AccountStatus = "pending_activation" | "active" | "suspended" | "deactivated";
export interface AuthorizedAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Exclude<BackendUserRole, "citizen">;
  organization?: string;
  position?: string;
  personnelId?: string;
  barangay?: string;
  utilityCompany?: string;
  repairOrganization?: string;
  repairTeam?: string;
  accountStatus: AccountStatus;
  requiresActivation: boolean;
  version: number;
  approval?: { authority?: string; reference?: string; recordedAt?: string };
}
export interface AuthorizedAccountPage {
  accounts: AuthorizedAccount[];
  pagination: { page: number; limit: number; total: number; pages: number };
  roles: AuthorizedAccount["role"][];
  barangays: string[];
  organizations?: string[];
  canManageAdministrators: boolean;
}
export const accountRoleLabels: Record<AuthorizedAccount["role"], string> = {
  barangay_official: "Barangay Official",
  city_engineer: "City Engineer",
  repair_personnel: "Repair Personnel",
  utility_provider: "Utility Provider",
  admin: "Admin",
};
export const accountStatusLabels: Record<AccountStatus, string> = {
  pending_activation: "Pending Activation", active: "Active", suspended: "Suspended", deactivated: "Deactivated",
};
