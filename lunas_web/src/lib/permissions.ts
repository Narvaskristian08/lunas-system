import type { Permission, UserProfile, UserRole } from "@/types";

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

export function hasAnyPermission(
  user: Pick<UserProfile, "permissions"> | null,
  permissions: Permission[],
) {
  return permissions.some((permission) => hasPermission(user, permission));
}
