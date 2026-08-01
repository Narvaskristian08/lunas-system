import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChartNoAxesCombined,
  CircleGauge,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  HardHat,
  HelpCircle,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
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
    label: "Operations",
    items: [
      { label: "Incoming reports", href: "/reports", icon: FileWarning, permission: "reports.view" },
      { label: "Incident management", href: "/incidents", icon: ShieldCheck, permission: "incidents.view" },
      { label: "Work orders", href: "/work-orders", icon: HardHat, permission: "work_orders.view" },
      { label: "SLA monitoring", href: "/sla", icon: ClipboardCheck, permission: "sla.view" },
      { label: "Repair verification", href: "/repairs", icon: FileCheck2, permission: "repairs.verify" },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Reports & analytics", href: "/analytics", icon: ChartNoAxesCombined, permission: "analytics.view" }],
  },
  {
    label: "Administration",
    items: [
      { label: "User management", href: "/admin/users", icon: Users, permission: "users.manage" },
      { label: "System settings", href: "/admin/settings/general", icon: Settings, permission: "settings.manage" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, permission: "notifications.view" },
      { label: "My profile", href: "/profile", icon: UserRound, permission: "profile.manage" },
      { label: "Help & support", href: "/help", icon: HelpCircle, permission: "support.create" },
    ],
  },
];
