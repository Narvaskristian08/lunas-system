import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  LockKeyhole,
  Mail,
  Phone,
  UserRoundCog,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { UserProfile } from "@/types";

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

export function ProfileSummary({ viewer, onNavigate }: { viewer: UserProfile; onNavigate?: () => void }) {
  const fullName = [viewer.firstName, viewer.middleName, viewer.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="h-16 border-b border-brand-800 bg-brand-900 sm:h-18" aria-hidden="true" />
        <div className="px-4 pb-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col sm:flex-row sm:items-end sm:gap-4">
              <Avatar firstName={viewer.firstName} lastName={viewer.lastName} size="lg" className="-mt-9 size-20 text-xl ring-4 ring-white" />
              <div className="mt-3 min-w-0 pb-1 sm:mt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-bold text-slate-950">{fullName}</h2>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RoleBadge role={viewer.role} />
                  {viewer.personnelId ? <span className="text-sm text-slate-500">{viewer.personnelId}</span> : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["citizen", "repair_personnel"].includes(viewer.backendRole) ? <Link href="/profile/edit" onNavigate={onNavigate} className={buttonStyles({ variant: "primary" })}>
                <UserRoundCog className="size-4" aria-hidden="true" /> Edit Profile
              </Link> : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4">
        <Card>
          <CardHeader title="Profile Information" className="px-4 py-3 sm:px-5" />
          <dl className="grid px-4 sm:grid-cols-2 sm:gap-x-6 sm:px-5">
            <DetailRow icon={Building2} label="Organization">{viewer.organization}</DetailRow>
            <DetailRow icon={Mail} label="Verified Email">
              <span className="break-all">{viewer.email}</span>
            </DetailRow>
            {["citizen", "repair_personnel"].includes(viewer.backendRole) ? <DetailRow icon={Phone} label="Contact Number">{viewer.phone ?? "Not provided"}</DetailRow> : null}
          </dl>
        </Card>

        <div>
          <Card className="p-4 sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BadgeCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Account Security</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {viewer.verified ? "Your email and assigned organization are verified." : "Your account is awaiting verification."}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Role, organization, account status, and administrative permissions can only be changed by an authorized administrator.
            </div>
            <Link href="/help" onNavigate={onNavigate} className="mt-2 inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Get Account Support
            </Link>
          </Card>


        </div>
      </div>
    </div>
  );
}
