"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DataTable } from "@/components/ui/data-table";
import { manageAccountAction } from "@/app/actions/authorized-accounts";
import { accountRoleLabels, accountStatusLabels, type AuthorizedAccount, type AuthorizedAccountPage } from "@/lib/authorized-accounts";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100";
type AccessAction = "active" | "suspended" | "deactivated" | "activation";
const actionLabels: Record<AccessAction, string> = { active: "Reactivate", suspended: "Suspend", deactivated: "Deactivate", activation: "Send activation email" };

export function AdminConsole({ data, viewerId, search }: { data: AuthorizedAccountPage; viewerId: string; search: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AuthorizedAccount | "new" | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ account: AuthorizedAccount; action: AccessAction } | null>(null);
  const [reason, setReason] = useState("");
  const [dialogError, setDialogError] = useState("");
  const canManage = (account: AuthorizedAccount) => account.id !== viewerId && (account.role !== "admin" || data.canManageAdministrators);

  function confirmAccess() {
    if (!dialog || pending) return;
    if (dialog.action !== "activation" && !reason.trim()) { setDialogError("Enter the reason for this access change."); return; }
    const form = new FormData();
    form.set("version", String(dialog.account.version));
    form.set("reason", reason);
    form.set("status", dialog.action);
    startTransition(async () => {
      try {
        const result = await manageAccountAction(dialog.action === "activation" ? "activation" : "status", dialog.account.id, form);
        if (!result.ok) { setDialogError(result.message); return; }
        setMessage(result.message);
        setDialog(null);
        setSelected(null);
        router.refresh();
      } catch { setDialogError("The service could not be reached. Refresh before retrying."); }
    });
  }

  return <div className="mx-auto max-w-[1680px] space-y-6">
    <PageHeader eyebrow="LUNAS · Account administration" title="Authorized Accounts"
      description="Provision personnel after their responsible organization has verified and approved access outside LUNAS."
      actions={<Button onClick={() => { setSelected("new"); setEditing(true); setMessage(""); }}><Plus className="size-4" />Create Authorized Account</Button>} />
    {message && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm">{message}</p>}
    <Card className="overflow-hidden">
      <CardHeader title="Personnel Accounts" description="Role, jurisdiction, and account status are enforced by the server." />
      <form action="/admin/users" className="flex gap-3 border-y bg-slate-50 p-4">
        <label className="flex-1 text-sm">Search accounts<input name="search" defaultValue={search} maxLength={100} placeholder="Name, Email, or Organization" className={inputClass} /></label>
        <Button type="submit" variant="secondary" className="self-end">Search</Button>
      </form>
      <DataTable caption="Authorized personnel" columns={[{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "scope", label: "Organization / Jurisdiction" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions" }]}
        rows={data.accounts.map(account => ({ id: account.id, cells: {
          name: <><strong>{account.firstName} {account.lastName}</strong><p className="text-xs text-slate-500">{account.email}</p></>,
          role: accountRoleLabels[account.role],
          scope: <>{account.organization || account.utilityCompany || account.repairOrganization || "—"}<p className="text-xs text-slate-500">{account.barangay || (account.role === "utility_provider" ? "Assigned utility organization" : "City-level scope")}</p></>,
          status: <StatusBadge tone={account.accountStatus === "active" ? "success" : account.accountStatus === "pending_activation" ? "warning" : "critical"}>{accountStatusLabels[account.accountStatus]}</StatusBadge>,
          actions: <Button variant="secondary" onClick={() => { setSelected(account); setEditing(false); }}>View</Button>,
        } }))} />
      {!data.accounts.length && <p className="p-6 text-sm text-slate-500">No authorized accounts match this search.</p>}
      <div className="flex items-center justify-between border-t p-4 text-sm">
        <span>{data.pagination.total} accounts · Page {data.pagination.page} of {Math.max(1, data.pagination.pages)}</span>
        <div className="flex gap-4">
          {data.pagination.page > 1 && <Link href={`/admin/users?${new URLSearchParams({ search, page: String(data.pagination.page - 1) })}`} className="text-brand-700">Previous</Link>}
          {data.pagination.page < data.pagination.pages && <Link href={`/admin/users?${new URLSearchParams({ search, page: String(data.pagination.page + 1) })}`} className="text-brand-700">Next</Link>}
        </div>
      </div>
    </Card>
    {selected && <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{selected === "new" ? "Create Authorized Account" : `${selected.firstName} ${selected.lastName}`}</h2>
        <div className="flex gap-2">{selected !== "new" && !editing && canManage(selected) && <Button variant="secondary" onClick={() => setEditing(true)}>Edit Approved Details</Button>}<Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div>
      </div>
      <AccountForm key={`${selected === "new" ? "new" : `${selected.id}-${selected.version}`}-${editing}`} account={selected === "new" ? undefined : selected} data={data} readOnly={!editing}
        onSaved={text => { setMessage(text); setSelected(null); router.refresh(); }} />
      {selected !== "new" && !editing && canManage(selected) && <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">
        {(selected.accountStatus === "active" ? ["suspended", "deactivated"]
          : selected.accountStatus === "pending_activation" ? ["activation", "deactivated"]
          : ["active", ...(selected.accountStatus === "suspended" ? ["deactivated"] : [])]).map(value => {
          const action = value as AccessAction;
          return <Button key={action} variant={action === "deactivated" ? "danger" : "secondary"} onClick={() => { setDialog({ account: selected, action }); setReason(""); setDialogError(""); }}>{actionLabels[action]}</Button>;
        })}
      </div>}
    </Card>}
    <ConfirmationDialog open={!!dialog} icon="none" title={`${dialog ? actionLabels[dialog.action] : "Update"} account?`}
      description={dialog?.action === "activation" ? "A new expiring link will be emailed to this person. Previous links will stop working."
        : "This changes the person's access immediately and revokes existing sessions. Historical actions and records will be retained."}
      confirmLabel={dialog ? actionLabels[dialog.action] : "Confirm"} destructive={dialog?.action === "deactivated" || dialog?.action === "suspended"}
      loading={pending} onClose={() => setDialog(null)} onConfirm={confirmAccess}>
      {dialog?.action !== "activation" && <label className="text-sm">Reason (required)<textarea className={inputClass} value={reason} maxLength={500} onChange={event => setReason(event.target.value)} /></label>}
      {dialogError && <p role="alert" className="mt-2 text-sm text-red-700">{dialogError}</p>}
    </ConfirmationDialog>
  </div>;
}

function AccountForm({ account, data, readOnly, onSaved }: { account?: AuthorizedAccount; data: AuthorizedAccountPage; readOnly: boolean; onSaved: (message: string) => void }) {
  const [role, setRole] = useState<AuthorizedAccount["role"]>(account?.role || "barangay_official");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const roles = data.roles.filter(value => value !== "admin" || data.canManageAdministrators || account?.role === "admin");
  function field(name: string, label: string, value = "", required = true, maxLength = 160, type = "text") {
    return <label className="block text-sm font-medium">{label}{required ? " *" : ""}<input className={inputClass} name={name} defaultValue={value} type={type} required={required} maxLength={maxLength} /></label>;
  }
  return <form onSubmit={event => {
    event.preventDefault();
    if (pending || readOnly) return;
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await manageAccountAction(account ? "edit" : "create", account?.id || "", form);
        if (result.ok) onSaved(result.message); else setError(result.message);
      } catch { setError("The service could not be reached. Refresh before retrying."); }
    });
  }}>
    <p className="mb-5 text-sm text-slate-600">{account ? `Status: ${accountStatusLabels[account.accountStatus]}.` : "Status: Pending Activation. The person will receive an email link to choose their own password."} Approval below records a decision already made by the responsible organization.</p>
    <input type="hidden" name="version" value={account?.version || 0} />
    <fieldset disabled={readOnly || pending} className="grid gap-5 md:grid-cols-2">
      {field("firstName", "First name", account?.firstName, true, 80)}
      {field("lastName", "Last name", account?.lastName, true, 80)}
      {account ? <div className="text-sm"><p className="font-medium">Email</p><p className="mt-3">{account.email}</p></div> : field("email", "Email", "", true, 254, "email")}
      {field("phone", "Contact number", account?.phone, true, 13, "tel")}
      {field("personnelId", "Employee / personnel ID (if applicable)", account?.personnelId, false, 80)}
      {field("position", "Position / designation", account?.position, true, 120)}
      {field("organization", "Office / organization", account?.organization)}
      <label className="text-sm font-medium">System role *<select name="role" value={role} onChange={event => setRole(event.target.value as AuthorizedAccount["role"])} className={inputClass}>{roles.map(value => <option key={value} value={value}>{accountRoleLabels[value]}</option>)}</select></label>
      {["barangay_official", "repair_personnel"].includes(role) && <label className="text-sm font-medium">Assigned barangay{role === "barangay_official" ? " *" : " (optional)"}<select name="barangay" className={inputClass} defaultValue={account?.barangay || ""} required={role === "barangay_official"}><option value="">{role === "repair_personnel" ? "Citywide within assigned organization" : "Select barangay"}</option>{data.barangays.map(value => <option key={value}>{value}</option>)}</select></label>}
      {role === "utility_provider" && field("utilityCompany", "Assigned utility company", account?.utilityCompany)}
      {role === "repair_personnel" && <>{field("repairOrganization", "Assigned repair organization", account?.repairOrganization)}{field("repairTeam", "Repair team (optional)", account?.repairTeam, false, 120)}</>}
      {field("approvalAuthority", "Approved By / Approving Authority", account?.approval?.authority)}
      <label className="text-sm font-medium md:col-span-2">Approval reference / remarks *<textarea className={inputClass} name="approvalReference" required maxLength={500} defaultValue={account?.approval?.reference || ""} placeholder="Reference or remarks confirming the offline authorization" /></label>
    </fieldset>
    {!readOnly && <div className="mt-6"><p className="mb-3 text-sm text-slate-600">By saving, you confirm that the role and jurisdiction match the organization&apos;s offline approval.</p><Button type="submit" loading={pending} loadingLabel="Saving Account…">{account ? "Save Approved Details" : "Create Account and Send Activation"}</Button></div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </form>;
}
