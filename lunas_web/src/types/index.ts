export type UserRole =
  | "Citizen"
  | "Repair Personnel"
  | "Admin"
  | "Barangay Official"
  | "City Engineer"
  | "Utility Provider";

/** Roles sent by the current Express API. Keep these separate from display labels. */
export type BackendUserRole =
  | "citizen"
  | "repair_personnel"
  | "barangay_official"
  | "city_engineer"
  | "utility_provider"
  | "admin";

export type Permission =
  | "dashboard.view"
  | "reports.view"
  | "reports.validate"
  | "work_orders.view"
  | "work_orders.manage"
  | "personnel.manage"
  | "repairs.verify"
  | "sla.view"
  | "users.manage"
  | "audit.view"
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
  backendRole: BackendUserRole;
  organization: string;
  utilityCompany?: string;
  barangay?: string;
  unit?: string;
  personnelId?: string;
  status: "Active" | "Suspended" | "Deactivated";
  verified: boolean;
  lastLogin?: string;
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

export type RequestState = "idle" | "loading" | "success" | "error";

export type AuthFailureCode =
  | "INVALID_CREDENTIALS"
  | "UNVERIFIED"
  | "SUSPENDED"
  | "DEACTIVATED"
  | "RATE_LIMITED"
  | "OFFLINE"
  | "SERVER_UNAVAILABLE"
  | "MAINTENANCE"
  | "CAPTCHA_REQUIRED";

export type AuthResult =
  | { ok: true; user: UserProfile }
  | { ok: false; code: AuthFailureCode; message: string };
