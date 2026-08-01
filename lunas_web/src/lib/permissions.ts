import type { Permission, UserProfile, UserRole } from "@/types";

export const rolePermissions: Record<UserRole, Permission[]> = {
  "Barangay Official": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "incidents.view",
    "incidents.assign",
    "work_orders.view",
    "work_orders.manage",
    "repairs.verify",
    "sla.view",
    "analytics.view",
    "analytics.view",
    "repairs.verify",
    "sla.view",
    "analytics.view",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "City Engineering Office": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "incidents.view",
    "incidents.assign",
    "work_orders.view",
    "work_orders.manage",
    "repairs.verify",
    "sla.view",
    "analytics.view",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "Utility Provider": [
    "dashboard.view",
    "incidents.view",
    "work_orders.view",
    "work_orders.manage",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "System Administrator": [
    "dashboard.view",
    "reports.view",
    "incidents.view",
    "work_orders.view",
    "sla.view",
    "analytics.view",
    "users.manage",
    "settings.manage",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "Maintenance Coordinator": [
    "dashboard.view",
    "incidents.view",
    "work_orders.view",
    "work_orders.manage",
    "repairs.verify",
    "sla.view",
    "notifications.view",
    "profile.manage",
    "support.create",
  ],
  "Executive Viewer": [
    "dashboard.view",
    "reports.view",
    "incidents.view",
    "work_orders.view",
    "sla.view",
    "analytics.view",
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
