import { roleLabels, rolePermissions } from "@/lib/permissions";
import type { BackendUserRole, Permission } from "@/types";

// Navigation hints only. Server Components/actions and the API continue to
// authorize every data read and mutation independently.
export function workspaceRedirect(path: string, search: string, role: BackendUserRole): string | null {
  const query = new URLSearchParams(search);
  const landing = role === "admin" ? "/admin/users" : "/dashboard";
  if (["citizen", "repair_personnel"].includes(role)) {
    return path === "/unauthorized" ? null : "/unauthorized?platform=mobile";
  }
  if (path === "/") return landing;
  if (path === "/dashboard" && role === "admin") return landing;
  if (path === "/profile" || path === "/profile/edit" || path === "/profile/change-password") {
    query.set("profile", path.endsWith("change-password") ? "password" : "1");
    return `${landing}?${query}`;
  }
  if (path === "/recovery-email") return landing;

  let target = path;
  if (/^\/(incidents|reports)(\/|$)/.test(path)) target = path.replace(/^\/(incidents|reports)/, "/validation-routing");
  if (/^\/repairs(\/|$)/.test(path)) target = path.replace(/^\/repairs/, "/work-orders");
  if (path.startsWith("/maintenance-coordination")) target = "/work-orders";
  if (path === "/admin") target = "/admin/users";
  if (/^\/sla\/[^/]+$/.test(path)) target = path.replace(/^\/sla/, "/work-orders");
  if (/^\/notifications\/[^/]+$/.test(path)) {
    query.set("notification", decodeURIComponent(path.split("/")[2]));
    target = "/notifications";
  }
  if (target === "/validation-routing" && role === "city_engineer") {
    target = "/work-orders";
    query.set("view", "review");
  }
  if (target === "/work-orders/intake") {
    target = "/work-orders";
    query.set("assignmentStatus", "unassigned");
  }

  const permission: Permission | undefined = target.startsWith("/admin/tickets") ? "support.manage"
    : target.startsWith("/admin/audit") ? "audit.view"
    : target.startsWith("/admin") ? "users.manage"
    : target.startsWith("/repair-personnel") ? "personnel.manage"
    : target.startsWith("/work-orders/intake/") ? "work_orders.manage"
    : target.startsWith("/work-orders") ? "work_orders.view"
    : target.startsWith("/validation-routing") ? "reports.view"
    : target.startsWith("/sla") ? "sla.view"
    : target.startsWith("/notifications") ? "notifications.view"
    : target.startsWith("/help") ? "support.create"
    : target === "/dashboard" ? "dashboard.view" : undefined;
  if (permission && !rolePermissions[roleLabels[role]].includes(permission)) return "/unauthorized";
  return target !== path ? `${target}${query.size ? `?${query}` : ""}` : null;
}
