import type { LucideIcon } from "lucide-react";
import {
  CircleGauge,
  ClipboardCheck,
  HelpCircle,
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
    label: "Account",
    items: [
      { label: "My profile", href: "/profile", icon: UserRound, permission: "profile.manage" },
      { label: "Help & support", href: "/help", icon: HelpCircle, permission: "support.create" },
    ],
  },
];
