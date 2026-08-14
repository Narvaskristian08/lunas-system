import type { Permission, UserProfile, UserRole } from "@/types";

export const rolePermissions: Record<UserRole, Permission[]> = {
  // This map only controls presentation (navigation and affordances). The API
  // remains the authorization source of truth for every protected request.
  Citizen: [
    "dashboard.view",
    "profile.manage",
    "support.create",
  ],
  "Barangay Official": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "incidents.view",
    "incidents.assign",
    "sla.view",
    "profile.manage",
    "support.create",
  ],
  "City Engineering Office": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "incidents.view",
    "incidents.assign",
    "sla.view",
    "profile.manage",
    "support.create",
  ],
  "Utility Provider": [
    "dashboard.view",
    "profile.manage",
    "support.create",
  ],
  "Repair Personnel": [
    "dashboard.view",
    "profile.manage",
    "support.create",
  ],
  "System Administrator": [
    "dashboard.view",
    "reports.view",
    "reports.validate",
    "incidents.view",
    "incidents.assign",
    "sla.view",
    "profile.manage",
    "support.create",
  ],
  "Maintenance Coordinator": [
    "dashboard.view",
    "profile.manage",
    "support.create",
  ],
  "Executive Viewer": [
    "dashboard.view",
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
