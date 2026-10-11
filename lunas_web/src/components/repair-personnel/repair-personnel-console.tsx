"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { createRepairPersonnelAction } from "@/app/actions/repair-personnel";
import { EmptyState } from "@/components/states/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import type { UserProfile } from "@/types";
import type { RepairPersonnelAccountStatus, RepairPersonnelRecord } from "@/lib/repair-personnel.server";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";

const statusLabel: Record<RepairPersonnelAccountStatus, string> = {
  pending_activation: "Pending Activation",
  active: "Active",
  suspended: "Suspended",
  deactivated: "Deactivated",
};

function statusTone(status: RepairPersonnelAccountStatus) {
  if (status === "active") return "success" as const;
  if (status === "pending_activation") return "warning" as const;
  return "critical" as const;
}

export function RepairPersonnelConsole({
  viewer,
  personnel,
  error,
}: {
  viewer: UserProfile;
  personnel: RepairPersonnelRecord[];
  error?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  function submit(form: FormData) {
    setMessage("");
    setFormError("");
    startTransition(async () => {
      const result = await createRepairPersonnelAction(form);
      if (result.ok) {
        setMessage(result.message);
        formRef.current?.reset();
      } else {
        setFormError(result.message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-[1680px] space-y-6">
      <PageHeader
        eyebrow="Maintenance operations · Team management"
        title="Repair Personnel"
        description="Add repair workers to your Utility Provider organization and invite them to activate their own accounts."
      />

      {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : null}

      <Card className="p-5">
        <CardHeader className="-mx-5 -mt-5" title="Add Repair Personnel" description="The new account will be assigned to your organization automatically." />
        <form ref={formRef} action={submit} className="mt-5 space-y-5">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
            <p className="font-semibold">Assigned organization</p>
            <p className="mt-1">{viewer.utilityCompany || viewer.organization}</p>
            <p className="mt-1 text-xs text-sky-800">Organization and system role are controlled by the server and cannot be changed in this form.</p>
          </div>

          <fieldset disabled={pending} className="grid gap-5 md:grid-cols-2">
            <label className="text-sm font-medium">First name *<input name="firstName" className={inputClass} required maxLength={80} /></label>
            <label className="text-sm font-medium">Last name *<input name="lastName" className={inputClass} required maxLength={80} /></label>
            <label className="text-sm font-medium">Email *<input name="email" type="email" className={inputClass} required maxLength={254} /></label>
            <label className="text-sm font-medium">Contact number *<input name="phone" type="tel" inputMode="tel" pattern="^(\\+639|09)\\d{9}$" placeholder="09XXXXXXXXX" className={inputClass} required maxLength={13} /></label>
            <label className="text-sm font-medium">Position / designation *<input name="position" className={inputClass} required maxLength={120} /></label>
            <label className="text-sm font-medium">Personnel ID <span className="font-normal text-slate-500">(optional)</span><input name="personnelId" className={inputClass} maxLength={80} /></label>
            <label className="text-sm font-medium">Repair team <span className="font-normal text-slate-500">(optional)</span><input name="repairTeam" className={inputClass} maxLength={120} /></label>
            <label className="text-sm font-medium">Assigned Barangay <span className="font-normal text-slate-500">(optional)</span><input name="barangay" className={inputClass} maxLength={100} placeholder="Official Dagupan barangay name" /></label>
          </fieldset>

          {formError ? <p role="alert" className="text-sm text-red-700">{formError}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending} loadingLabel="Creating account…"><UserPlus className="size-4" aria-hidden="true" />Create and Send Activation</Button>
            <p className="text-xs text-slate-500">The repair person chooses their password from the activation email.</p>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Organization Personnel" description={`${personnel.length} non-archived Repair Personnel account${personnel.length === 1 ? "" : "s"} in your organization.`} />
        {personnel.length ? (
          <DataTable
            caption="Repair Personnel roster"
            columns={[
              { key: "name", label: "Name", className: "w-[22%]" },
              { key: "position", label: "Position", className: "w-[18%]" },
              { key: "team", label: "Team / Barangay", className: "w-[22%]" },
              { key: "contact", label: "Contact", className: "w-[23%]" },
              { key: "status", label: "Status", className: "w-[15%]" },
            ]}
            rows={personnel.map((person) => ({
              id: person.id,
              cells: {
                name: <div><p className="font-semibold text-slate-900">{person.firstName} {person.lastName}</p>{person.personnelId ? <p className="text-xs text-slate-500">ID: {person.personnelId}</p> : null}</div>,
                position: person.position || "—",
                team: <div><p>{person.repairTeam || "No team assigned"}</p><p className="text-xs text-slate-500">{person.barangay || "Citywide"}</p></div>,
                contact: <div><p className="break-words">{person.email}</p><p className="text-xs text-slate-500">{person.phone || "No phone number"}</p></div>,
                status: <StatusBadge tone={statusTone(person.accountStatus)}>{statusLabel[person.accountStatus]}</StatusBadge>,
              },
            }))}
          />
        ) : (
          <EmptyState icon="records" title="No Repair Personnel yet" description="Add a repair person to make them available for matching work orders after activation." />
        )}
      </Card>
    </div>
  );
}
