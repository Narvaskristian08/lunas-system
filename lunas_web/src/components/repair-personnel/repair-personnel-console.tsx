"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { createRepairPersonnelAction, manageRepairPersonnelAction } from "@/app/actions/repair-personnel";
import { EmptyState } from "@/components/states/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
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
  organization,
  error,
}: {
  personnel: RepairPersonnelRecord[];
  organization: string;
  error?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState(false);
  const [formError, setFormError] = useState("");
  const [accountType, setAccountType] = useState<"individual" | "team">("individual");

  const [editing, setEditing] = useState<RepairPersonnelRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<RepairPersonnelRecord | null>(null);

  function manage(person: RepairPersonnelRecord, operation: "invite" | "status", form: FormData) {
    form.set("version", String(person.version));
    setMessage(""); setFormError("");
    startTransition(async () => {
      const result = await manageRepairPersonnelAction(person.id, operation, form);
      if (result.ok) { setMessage(result.message); setWarning(!!result.warning); setStatusTarget(null); }
      else setFormError(result.message);
    });
  }

  function submit(form: FormData) {
    setMessage("");
    setFormError("");
    startTransition(async () => {
      const result = editing ? await manageRepairPersonnelAction(editing.id, "edit", form) : await createRepairPersonnelAction(form);
      if (result.ok) {
        setMessage(result.message); setWarning(!!result.warning);
        formRef.current?.reset();
        setAccountType("individual");
        setEditing(null);
      } else {
        setFormError(result.message);
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Maintenance operations · Team management"
        title="Repair Personnel"
        description="Add repair workers to your Utility Provider organization and invite them to activate their own accounts."
      />

      {message ? <p role="status" className={`rounded-xl border p-4 text-sm ${warning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{message}</p> : null}
      {formError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{formError}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</p> : null}

      <Card className="p-5">
        <CardHeader className="-mx-5 -mt-5" title={editing ? "Edit Personnel Details" : "Add Repair Personnel"} />
        <form key={editing?.id ?? "new"} ref={formRef} action={submit} className="mt-5 space-y-6">
          <input type="hidden" name="version" value={editing?.version ?? 0} />
          <fieldset disabled={pending}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Account Type
                <select name="repairAccountType" value={accountType} onChange={(event) => setAccountType(event.target.value as "individual" | "team")} className={inputClass}>
                  <option value="individual">Individual</option>
                  <option value="team">Team Leader</option>
                </select>
              </label>
              {accountType === "team" ? <label className="block text-sm font-medium text-slate-700">Team Name *<input name="repairTeam" defaultValue={editing?.repairTeam} className={inputClass} required maxLength={120} placeholder="e.g. Water Crew A" /></label> : <input type="hidden" name="repairTeam" value="" />}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Each account belongs to one person. A team leader manages work on behalf of their team using their own login.</p>
          </fieldset>

          <fieldset disabled={pending} className="border-t border-slate-200 pt-4">
            <legend className="pr-3 text-sm font-semibold text-slate-900">{accountType === "team" ? "Team Leader Details" : "Personnel Details"}</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">First Name *<input name="firstName" defaultValue={editing?.firstName} autoComplete="given-name" className={inputClass} required maxLength={80} /></label>
              <label className="block text-sm font-medium text-slate-700">Last Name *<input name="lastName" defaultValue={editing?.lastName} autoComplete="family-name" className={inputClass} required maxLength={80} /></label>
              <label className="block text-sm font-medium text-slate-700">Middle Name (Optional)<input name="middleName" defaultValue={editing?.middleName} autoComplete="additional-name" className={inputClass} maxLength={80} /></label>
              <label className="block text-sm font-medium text-slate-700">Suffix (Optional)<input name="suffix" defaultValue={editing?.suffix} className={inputClass} maxLength={20} placeholder="e.g. Jr., III" /></label>
              <label className="block text-sm font-medium text-slate-700">Email *<input name="email" defaultValue={editing?.email} disabled={!!editing} type="email" autoComplete="email" className={inputClass} required maxLength={254} /></label>
              <label className="block text-sm font-medium text-slate-700">Contact Number *<input name="phone" defaultValue={editing?.phone} type="tel" autoComplete="tel" inputMode="tel" pattern={"^(\\+639|09)\\d{9}$"} placeholder="09XXXXXXXXX" className={inputClass} required maxLength={13} /></label>
            </div>
          </fieldset>

          {editing ? <p className="text-xs text-slate-500">Email identifies the account and cannot be changed here. To transfer team leadership, invite the new leader with their own email and deactivate the previous account.</p> : null}
          <div className="flex flex-col items-start gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
            <Button type="submit" disabled={!organization} loading={pending} loadingLabel={editing ? "Saving…" : "Creating account…"}><UserPlus className="size-4" aria-hidden="true" />{editing ? "Save Changes" : "Create Account and Send Invitation"}</Button>
            {editing ? <Button type="button" variant="secondary" disabled={pending} onClick={() => { setEditing(null); setAccountType("individual"); setFormError(""); }}>Cancel</Button> : null}
            {!editing ? <p className="max-w-md text-xs leading-5 text-slate-500">{accountType === "team" ? "The team leader" : "The repair person"} receives an invitation by email and chooses their own password. Access starts after activation.</p> : null}
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Organization Personnel" description={`${personnel.length} non-archived Repair Personnel account${personnel.length === 1 ? "" : "s"} in your organization.`} />
        {personnel.length ? (
          <DataTable
            caption="Repair Personnel roster"
            columns={[
              { key: "name", label: "Name" },
              { key: "team", label: "Account Type" },
              { key: "contact", label: "Contact" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions" },
            ]}
            rows={personnel.map((person) => ({
              id: person.id,
              cells: {
                name: <p className="font-semibold text-slate-900">{[person.firstName, person.middleName, person.lastName, person.suffix].filter(Boolean).join(" ")}</p>,
                team: <div><p>{person.repairAccountType === "team" ? "Team Leader" : "Individual"}</p>{person.repairAccountType === "team" && person.repairTeam ? <p className="text-xs text-slate-500">{person.repairTeam}</p> : null}</div>,
                contact: <div><p className="break-words">{person.email}</p><p className="text-xs text-slate-500">{person.phone || "No phone number"}</p></div>,
                actions: <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => { setEditing(person); setAccountType(person.repairAccountType ?? "individual"); setFormError(""); formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Edit</Button>
                  {person.accountStatus === "pending_activation" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => manage(person, "invite", new FormData())}>Resend Invitation</Button> : null}
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => { setStatusTarget(person); setFormError(""); }}>{person.accountStatus === "deactivated" || person.accountStatus === "suspended" ? "Reactivate" : "Deactivate"}</Button>
                </div>,
                status: <StatusBadge tone={statusTone(person.accountStatus)}>{statusLabel[person.accountStatus]}</StatusBadge>,
              },
            }))}
          />
        ) : (
          <EmptyState icon="records" title="No Repair Personnel yet" description="Add a repair person to make them available for matching work orders after activation." />
        )}
      </Card>
      <Modal open={!!statusTarget} title={statusTarget?.accountStatus === "deactivated" || statusTarget?.accountStatus === "suspended" ? "Reactivate Personnel" : "Deactivate Personnel"} busy={pending} size="compact" onClose={() => setStatusTarget(null)}>
        {statusTarget ? <form action={form => manage(statusTarget, "status", form)} className="space-y-5">
          <input type="hidden" name="status" value={statusTarget.accountStatus === "deactivated" || statusTarget.accountStatus === "suspended" ? "active" : "deactivated"} />
          <p className="text-sm leading-6 text-slate-600">Update access for {statusTarget.firstName} {statusTarget.lastName}. Deactivation prevents sign-in and revokes existing sessions. Their account and work history are retained.</p>
          <label className="block text-sm font-medium">Reason *<textarea name="reason" required maxLength={500} className={inputClass} rows={3} /></label>
          {formError ? <p role="alert" className="text-sm text-red-700">{formError}</p> : null}
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={pending} onClick={() => setStatusTarget(null)}>Cancel</Button><Button type="submit" variant={statusTarget.accountStatus === "deactivated" || statusTarget.accountStatus === "suspended" ? "primary" : "danger"} loading={pending}>{statusTarget.accountStatus === "deactivated" || statusTarget.accountStatus === "suspended" ? "Reactivate Personnel" : "Deactivate Personnel"}</Button></div>
        </form> : null}
      </Modal>
    </div>
  );
}
