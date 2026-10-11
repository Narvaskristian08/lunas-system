import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { Permission, UserProfile } from "@/types";

const permissionLabels: Record<Permission, string> = {
  "dashboard.view": "View dashboard",
  "reports.view": "View reports",
  "reports.validate": "Validate reports",
  "work_orders.view": "View work orders",
  "work_orders.manage": "Manage work orders",
  "personnel.manage": "Manage repair personnel",
  "repairs.verify": "Verify repairs",
  "sla.view": "View SLA monitoring",
  "users.manage": "Manage users",
  "audit.view": "View security audit trail",
  "notifications.view": "View notifications",
  "profile.manage": "Manage own profile",
  "support.create": "Contact support",
};

function DetailRow({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3 border-b border-slate-100 py-3.5 last:border-0">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-normal text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium leading-5 text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

export function ProfileSummary({ viewer }: { viewer: UserProfile }) {
  const fullName = [viewer.firstName, viewer.middleName, viewer.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="h-24 border-b border-brand-800 bg-brand-900 sm:h-28" aria-hidden="true" />
        <div className="px-5 pb-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-end sm:gap-4">
              <Avatar firstName={viewer.firstName} lastName={viewer.lastName} size="xl" className="-mt-12 size-24 text-2xl ring-4 ring-white sm:size-28" />
              <div className="mt-3 min-w-0 pb-1 sm:mt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-bold text-slate-950 sm:text-2xl">{fullName}</h2>
                  <StatusBadge tone="success">{viewer.status}</StatusBadge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RoleBadge role={viewer.role} />
                  {viewer.personnelId ? <span className="text-sm text-slate-500">{viewer.personnelId}</span> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/profile/change-password" className={buttonStyles({ variant: "secondary" })}>
                <KeyRound className="size-4" aria-hidden="true" /> Change Password
              </Link>
              <Link href="/profile/edit" className={buttonStyles({ variant: "primary" })}>
                <UserRoundCog className="size-4" aria-hidden="true" /> Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader title="Profile Information" description="Your verified contact and organizational details." />
          <dl className="grid px-5 sm:grid-cols-2 sm:gap-x-6">
            <DetailRow icon={Building2} label="Organization">{viewer.organization}</DetailRow>
            <DetailRow icon={ShieldCheck} label="Department or Unit">{viewer.unit ?? "Not Assigned"}</DetailRow>
            <DetailRow icon={Mail} label="Verified Email">
              <span className="break-all">{viewer.email}</span>
            </DetailRow>
            <DetailRow icon={Phone} label="Contact Number">{viewer.phone ?? "Not provided"}</DetailRow>
            <DetailRow icon={Clock3} label="Last Login">{viewer.lastLogin ? formatDateTime(viewer.lastLogin) : "Not available"}</DetailRow>
            <DetailRow icon={CalendarDays} label="Date Joined">{formatDateTime(viewer.joinedAt)}</DetailRow>
          </dl>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BadgeCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Account Security</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {viewer.verified ? "Your email and assigned organization are verified." : "Your account is awaiting verification."}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Role, organization, account status, and administrative permissions can only be changed by an authorized administrator.
            </div>
            <Link href="/help" className="mt-3 inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Get Account Support
            </Link>
          </Card>

          <Card>
            <CardHeader title="Assigned Permissions" description={`${viewer.permissions.length} capabilities from your current role.`} />
            <ul className="grid gap-2 p-5 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-1">
              {viewer.permissions.map((permission) => (
                <li key={permission} className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-brand-700" aria-hidden="true" />
                  {permissionLabels[permission]}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
