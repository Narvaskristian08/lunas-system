export type UserRole =
  | "Barangay Official"
  | "City Engineering Office"
  | "Utility Provider"
  | "System Administrator"
  | "Maintenance Coordinator"
  | "Executive Viewer";

export type Permission =
  | "dashboard.view"
  | "reports.view"
  | "reports.validate"
  | "incidents.view"
  | "incidents.assign"
  | "work_orders.view"
  | "work_orders.manage"
  | "repairs.verify"
  | "sla.view"
  | "analytics.view"
  | "users.manage"
  | "settings.manage"
  | "notifications.view"
  | "profile.manage"
  | "support.create";

export interface UserProfile {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  organization: string;
  unit?: string;
  personnelId: string;
  status: "Active" | "Suspended" | "Deactivated";
  verified: boolean;
  lastLogin: string;
  joinedAt: string;
  permissions: Permission[];
  avatarUrl?: string;
}

export type Severity = "critical" | "warning" | "information" | "success" | "neutral";
export type NotificationCategory =
  | "Reports"
  | "Work orders"
  | "SLA"
  | "Repairs"
  | "Security"
  | "System";

export interface LunasNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  fullMessage: string;
  timestamp: string;
  read: boolean;
  severity: Severity;
  source: string;
  relatedRecord?: {
    type: "report" | "incident" | "work-order" | "sla" | "repair" | "account" | "announcement";
    id: string;
    label: string;
    href?: string;
    available: boolean;
    restricted?: boolean;
  };
}

export interface DashboardMetric {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "steady";
  tone: Severity;
  icon: "reports" | "incident" | "workOrder" | "sla" | "users" | "verified";
}

export interface DashboardConfig {
  eyebrow: string;
  title: string;
  description: string;
  metrics: DashboardMetric[];
  quickActions: Array<{
    label: string;
    description: string;
    href: string;
    permission?: Permission;
    icon: "report" | "assign" | "verify" | "users" | "analytics" | "workOrder";
  }>;
  alert: {
    title: string;
    message: string;
    tone: Severity;
    actionLabel: string;
  };
}

export type BarangayModule = "reports" | "incidents" | "work-orders" | "sla" | "repairs" | "analytics";

export type BarangayPriority = "Critical" | "High" | "Medium" | "Low";
export type BarangayStatus = "Pending Validation" | "Validated" | "Assigned" | "In Progress" | "Awaiting Verification" | "Resolved" | "Closed";

export interface BarangayRecord {
  id: string;
  kind: "report" | "incident" | "work-order" | "repair";
  title: string;
  category: string;
  priority: BarangayPriority;
  status: BarangayStatus;
  location: string;
  barangay: string;
  submittedAt: string;
  reporter: string;
  assignee?: string;
  dueAt?: string;
  aiConfidence?: number;
  description: string;
}

export interface HelpTopic {
  id: string;
  category: string;
  title: string;
  summary: string;
  articles: number;
  keywords: string[];
}

export type RequestState = "idle" | "loading" | "success" | "error";

export type AuthFailureCode =
  | "INVALID_CREDENTIALS"
  | "UNVERIFIED"
  | "SUSPENDED"
  | "DEACTIVATED"
  | "RATE_LIMITED"
  | "OFFLINE"
  | "SERVER_UNAVAILABLE"
  | "MAINTENANCE";

export type AuthResult =
  | { ok: true; user: UserProfile }
  | { ok: false; code: AuthFailureCode; message: string };
