import type { LucideIcon } from "lucide-react";
import {
  CircleGauge,
  ClipboardList,
  ClipboardCheck,
  Bell,
  HelpCircle,
  ScrollText,
  Timer,
  UserRound,
} from "lucide-react";
import type { Permission } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  exact?: boolean;
}

export const navigationGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: CircleGauge, permission: "dashboard.view", exact: true }],
  },
  {
    label: "Official review",
    items: [{ label: "Pending validation", href: "/validation-routing", icon: ClipboardCheck, permission: "reports.view" }],
  },
  {
    label: "Maintenance operations",
    items: [
      { label: "Work orders", href: "/work-orders", icon: ClipboardList, permission: "work_orders.view" },
      { label: "SLA monitor", href: "/sla", icon: Timer, permission: "sla.view" },
    ],
  },
  {
    label: "Updates",
    items: [{ label: "Notifications", href: "/notifications", icon: Bell, permission: "notifications.view" }],
  },
  {
    label: "Administration",
    items: [{ label: "Authorized accounts", href: "/admin/users", icon: UserRound, permission: "users.manage" }, { label: "Audit trail", href: "/admin/audit", icon: ScrollText, permission: "audit.view" }],
  },
  {
    label: "Account",
    items: [
      { label: "My profile", href: "/profile", icon: UserRound, permission: "profile.manage" },
      { label: "Help & support", href: "/help", icon: HelpCircle, permission: "support.create" },
    ],
  },
];
