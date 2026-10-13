import type { BackendUserRole, Permission, UserProfile, UserRole } from "@/types";

export const roleLabels: Record<BackendUserRole, UserRole> = {
  citizen: "Citizen",
  repair_personnel: "Repair Personnel",
  barangay_official: "Barangay Official",
  city_engineer: "City Engineer",
  utility_provider: "Utility Provider",
  admin: "Admin",
};

export const rolePermissions: Record<UserRole, Permission[]> = {
  Citizen: [],
  "Repair Personnel": [],
  Admin: ["users.manage", "audit.view", "notifications.view", "profile.manage", "support.create", "support.manage"],
  "Barangay Official": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "City Engineer": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "work_orders.view",
    "repairs.verify",
    "sla.view",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "Utility Provider": [
    "dashboard.view",
    "work_orders.view",
    "work_orders.manage",
    "personnel.manage",
    "sla.view",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
};

export function hasPermission(
  user: Pick<UserProfile, "permissions"> | null,
  permission: Permission,
) {
  return Boolean(user?.permissions.includes(permission));
}
