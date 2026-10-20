import type { LucideIcon } from "lucide-react";
import {
  CircleGauge,
  ClipboardList,
  ClipboardCheck,
  LifeBuoy,
  ScrollText,
  Timer,
  UserRound,
} from "lucide-react";
import type { BackendUserRole, Permission } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  exact?: boolean;
  hiddenForRoles?: BackendUserRole[];
  visibleForRoles?: BackendUserRole[];
}

export const navigationGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: CircleGauge, permission: "dashboard.view", exact: true },
    ],
  },
  {
    label: "Maintenance Operations",
    items: [
      { label: "Pending Validation", href: "/validation-routing", icon: ClipboardCheck, permission: "reports.view", hiddenForRoles: ["city_engineer"] },
      { label: "Barangay Reports", href: "/validation-routing/reports", icon: ClipboardCheck, permission: "reports.view", visibleForRoles: ["barangay_official"] },
      { label: "Tanod Accounts", href: "/validation-routing/tanods", icon: UserRound, permission: "reports.validate", visibleForRoles: ["barangay_official"] },
      { label: "Work Orders", href: "/work-orders", icon: ClipboardList, permission: "work_orders.view", hiddenForRoles: ["city_engineer"] },
      { label: "Agency Reports", href: "/work-orders/reports", icon: ClipboardList, permission: "work_orders.view", visibleForRoles: ["utility_provider"] },
      { label: "Maintenance", href: "/work-orders", icon: ClipboardList, permission: "work_orders.view", visibleForRoles: ["city_engineer"] },
      { label: "SLA Monitor", href: "/sla", icon: Timer, permission: "sla.view", hiddenForRoles: ["city_engineer", "utility_provider"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Authorized Accounts", href: "/admin/users", icon: UserRound, permission: "users.manage" },
      { label: "Support Tickets", href: "/admin/tickets", icon: LifeBuoy, permission: "support.manage" },
      { label: "Audit Trail", href: "/admin/audit", icon: ScrollText, permission: "audit.view" },
    ],
  },
];
