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
  personnel,
  error,
}: {
  personnel: RepairPersonnelRecord[];
  error?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [accountType, setAccountType] = useState<"individual" | "team">("individual");

  function submit(form: FormData) {
    setMessage("");
    setFormError("");
    startTransition(async () => {
      const result = await createRepairPersonnelAction(form);
      if (result.ok) {
        setMessage(result.message);
        formRef.current?.reset();
        setAccountType("individual");
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
        <CardHeader className="-mx-5 -mt-5" title="Add Repair Personnel" />
        <form ref={formRef} action={submit} className="mt-5 space-y-6">
          <fieldset disabled={pending}>
            <legend className="mb-3 text-sm font-semibold text-slate-900">Account type</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Represents
                <select name="repairAccountType" value={accountType} onChange={(event) => setAccountType(event.target.value as "individual" | "team")} className={inputClass}>
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                </select>
              </label>
              {accountType === "team" ? <label className="block text-sm font-medium text-slate-700">Team name *<input name="repairTeam" className={inputClass} required maxLength={120} placeholder="e.g. Water Crew A" /></label> : <input type="hidden" name="repairTeam" value="" />}
            </div>
          </fieldset>

          <fieldset disabled={pending} className="border-t border-slate-200 pt-4">
            <legend className="pr-3 text-sm font-semibold text-slate-900">{accountType === "team" ? "Team leader details" : "Personnel details"}</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">First name *<input name="firstName" autoComplete="given-name" className={inputClass} required maxLength={80} /></label>
              <label className="block text-sm font-medium text-slate-700">Last name *<input name="lastName" autoComplete="family-name" className={inputClass} required maxLength={80} /></label>
              <label className="block text-sm font-medium text-slate-700">Email *<input name="email" type="email" autoComplete="email" className={inputClass} required maxLength={254} /></label>
              <label className="block text-sm font-medium text-slate-700">Contact number *<input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="^(\\+639|09)\\d{9}$" placeholder="09XXXXXXXXX" className={inputClass} required maxLength={13} /></label>
            </div>
          </fieldset>

          {formError ? <p role="alert" className="text-sm text-red-700">{formError}</p> : null}
          <div className="flex flex-col items-start gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
            <Button type="submit" loading={pending} loadingLabel="Creating account…"><UserPlus className="size-4" aria-hidden="true" />Create and Send Activation</Button>
            <p className="max-w-md text-xs leading-5 text-slate-500">{accountType === "team" ? "The team leader" : "The repair person"} chooses their password from the activation email.</p>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Organization Personnel" description={`${personnel.length} non-archived Repair Personnel account${personnel.length === 1 ? "" : "s"} in your organization.`} />
        {personnel.length ? (
          <DataTable
            caption="Repair Personnel roster"
            columns={[
              { key: "name", label: "Name", className: "w-[25%]" },
              { key: "team", label: "Represents", className: "w-[25%]" },
              { key: "contact", label: "Contact", className: "w-[35%]" },
              { key: "status", label: "Status", className: "w-[15%]" },
            ]}
            rows={personnel.map((person) => ({
              id: person.id,
              cells: {
                name: <p className="font-semibold text-slate-900">{person.firstName} {person.lastName}</p>,
                team: <div><p>{person.repairAccountType === "team" ? "Team" : "Individual"}</p>{person.repairAccountType === "team" && person.repairTeam ? <p className="text-xs text-slate-500">{person.repairTeam}</p> : null}</div>,
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
