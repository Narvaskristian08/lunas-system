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
import { FilterBar, FilterSelect } from "@/components/ui/filters";
import { Modal } from "@/components/ui/modal";
import { manageAccountAction } from "@/app/actions/authorized-accounts";
import { accountRoleLabels, accountStatusLabels, type AuthorizedAccount, type AuthorizedAccountPage } from "@/lib/authorized-accounts";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100";
type AccessAction = "active" | "suspended" | "deactivated" | "activation";
const actionLabels: Record<AccessAction, string> = { active: "Reactivate", suspended: "Suspend", deactivated: "Deactivate", activation: "Send activation email" };

function displayPosition(position?: string) {
  return position
    ?.replaceAll("Barangay Secretary", "Barangay Infrastructure Committee")
    .replaceAll("Secretary", "Infrastructure Committee")
    .replaceAll("Barangay Tanod", "Barangay Committee Staff")
    .replaceAll("Tanod", "Committee Staff");
}

export function AdminConsole({ data, viewerId, search, filters }: { data: AuthorizedAccountPage; viewerId: string; search: string; filters: { role: string; status: string; organization: string } }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AuthorizedAccount | "new" | null>(null);
  const [editing, setEditing] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ account: AuthorizedAccount; action: AccessAction } | null>(null);
  const [reason, setReason] = useState("");
  const [dialogError, setDialogError] = useState("");
  const canManage = (account: AuthorizedAccount) => account.id !== viewerId && (account.role !== "admin" || data.canManageAdministrators);
  const pageHref = (page: number) => `/admin/users?${new URLSearchParams({ search, ...filters, page: String(page) })}`;

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
      <form action="/admin/users" className="flex flex-wrap items-end gap-3 border-y bg-slate-50 p-4">
        <label className="flex-1 text-sm">Search accounts<input name="search" defaultValue={search} maxLength={100} placeholder="Name, Email, or Organization" className={inputClass} /></label>
        <Button type="submit" variant="secondary" className="self-end">Search</Button>
        <FilterBar className="w-full rounded-lg border-0 p-0" activeCount={Object.values(filters).filter(Boolean).length}>
          <FilterSelect label="Role" name="role" defaultValue={filters.role} onChange={event => event.currentTarget.form?.requestSubmit()} options={[{ value: "", label: "All Roles" }, ...data.roles.map(role => ({ value: role, label: accountRoleLabels[role] }))]} />
          <FilterSelect label="Organization" name="organization" className="sm:min-w-72 sm:flex-[2]" defaultValue={filters.organization} onChange={event => event.currentTarget.form?.requestSubmit()} options={[{ value: "", label: "All Organizations" }, ...[...new Set([...(data.organizations || []), ...(filters.organization ? [filters.organization] : [])])].map(name => ({ value: name, label: name }))]} />
          <FilterSelect label="Status" name="status" defaultValue={filters.status} onChange={event => event.currentTarget.form?.requestSubmit()} options={[{ value: "", label: "All Statuses" }, ...Object.entries(accountStatusLabels).map(([value, label]) => ({ value, label }))]} />
        </FilterBar>
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
          {data.pagination.page > 1 && <Link href={pageHref(data.pagination.page - 1)} className="text-brand-700">Previous</Link>}
          {data.pagination.page < data.pagination.pages && <Link href={pageHref(data.pagination.page + 1)} className="text-brand-700">Next</Link>}
        </div>
      </div>
    </Card>
    {selected && <Modal open={!dialog} busy={savingAccount} onClose={() => setSelected(null)}
      title={selected === "new" ? "Create Authorized Account" : `${selected.firstName} ${selected.lastName}`}
      action={selected !== "new" && !editing && canManage(selected) ? <Button variant="secondary" onClick={() => setEditing(true)}>Edit Approved Details</Button> : undefined}>
      <AccountForm key={`${selected === "new" ? "new" : `${selected.id}-${selected.version}`}-${editing}`} account={selected === "new" ? undefined : selected} data={data} readOnly={!editing}
        onBusyChange={setSavingAccount}
        onSaved={text => { setMessage(text); setSelected(null); router.refresh(); }} />
      {selected !== "new" && !editing && canManage(selected) && <div className="mt-6 flex flex-wrap gap-3 border-t pt-5">
        {(selected.accountStatus === "active" ? ["suspended", "deactivated"]
          : selected.accountStatus === "pending_activation" ? ["activation", "deactivated"]
          : ["active", ...(selected.accountStatus === "suspended" ? ["deactivated"] : [])]).map(value => {
          const action = value as AccessAction;
          return <Button key={action} variant={action === "deactivated" ? "danger" : "secondary"} onClick={() => { setDialog({ account: selected, action }); setReason(""); setDialogError(""); }}>{actionLabels[action]}</Button>;
        })}
      </div>}
    </Modal>}
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

function AccountForm({ account, data, readOnly, onSaved, onBusyChange }: { account?: AuthorizedAccount; data: AuthorizedAccountPage; readOnly: boolean; onSaved: (message: string) => void; onBusyChange: (busy: boolean) => void }) {
  const [role, setRole] = useState<AuthorizedAccount["role"]>(account?.role || "barangay_official");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<FormData | null>(null);
  const roles = data.roles.filter(value => value !== "admin" || data.canManageAdministrators || account?.role === "admin");
  function field(name: string, label: string, value = "", required = true, maxLength = 160, type = "text") {
    return <label className="block text-sm font-medium">{label}{required ? " *" : ""}<input className={inputClass} name={name} defaultValue={value} type={type} required={required} maxLength={maxLength} /></label>;
  }
  const saveConfirmed = () => {
    if (!confirmation || pending) return;
    const form = confirmation;
    onBusyChange(true);
    startTransition(async () => {
      try {
        const result = await manageAccountAction(account ? "edit" : "create", account?.id || "", form);
        if (result.ok) onSaved(result.message); else setError(result.message);
      } catch { setError("The service could not be reached. Refresh before retrying."); }
      finally { setConfirmation(null); onBusyChange(false); }
    });
  };
  return <form onSubmit={event => {
    event.preventDefault();
    if (pending || readOnly) return;
    const form = new FormData(event.currentTarget);
    setConfirmation(form);
    onBusyChange(true);
  }}>
    <p className="mb-5 text-sm text-slate-600">{account ? `Status: ${accountStatusLabels[account.accountStatus]}.` : "Status: Pending Activation. The person will receive an email link to choose their own password."} Approval below records a decision already made by the responsible organization.</p>
    <input type="hidden" name="version" value={account?.version || 0} />
    <fieldset disabled={readOnly || pending} className="grid gap-5 md:grid-cols-2">
      {field("firstName", "First name", account?.firstName, true, 80)}
      {field("lastName", "Last name", account?.lastName, true, 80)}
      {account ? <div className="text-sm"><p className="font-medium">Email</p><p className="mt-3">{account.email}</p></div> : field("email", "Email", "", true, 254, "email")}
      {role === "utility_personnel" && field("phone", "Contact number", account?.phone, true, 13, "tel")}
      {field("personnelId", "Employee / personnel ID (if applicable)", account?.personnelId, false, 80)}
      {field("position", "Position / designation", displayPosition(account?.position), true, 120)}
      {field("organization", "Office / organization", account?.organization)}
      <label className="text-sm font-medium">System role *<select name="role" value={role} onChange={event => setRole(event.target.value as AuthorizedAccount["role"])} className={inputClass}>{roles.map(value => <option key={value} value={value}>{accountRoleLabels[value]}</option>)}</select></label>
      {["barangay_official", "utility_personnel"].includes(role) && <label className="text-sm font-medium">Assigned barangay *<select name="barangay" className={inputClass} defaultValue={account?.barangay || ""} required><option value="">Select barangay</option>{data.barangays.map(value => <option key={value}>{value}</option>)}</select></label>}
      {role === "utility_provider" && field("utilityCompany", "Assigned utility company", account?.utilityCompany)}
      {role === "utility_personnel" ? <p className="text-sm leading-6 text-slate-600">This account is a Barangay Committee Staff / Utility Personnel account. It can inspect reports only within the assigned barangay.</p> : null}
      {field("approvalAuthority", "Approved By / Approving Authority", account?.approval?.authority)}
      <label className="text-sm font-medium md:col-span-2">Approval reference / remarks *<textarea className={inputClass} name="approvalReference" required maxLength={500} defaultValue={account?.approval?.reference || ""} placeholder="Reference or remarks confirming the offline authorization" /></label>
    </fieldset>
    {!readOnly && <div className="mt-6"><p className="mb-3 text-sm text-slate-600">By saving, you confirm that the role and jurisdiction match the organization&apos;s offline approval.</p><Button type="submit" loading={pending} loadingLabel="Saving Account…">{account ? "Save Approved Details" : "Create Account and Send Activation"}</Button></div>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  <ConfirmationDialog open={!!confirmation} icon="none" title={account ? "Save Approved Account Changes" : "Create Authorized Account"} description={account ? "Save these approved details? Existing sessions will be revoked and the person must sign in again." : "Create this account and send an activation invitation? The person will choose their own password."} confirmLabel={account ? "Save Account Changes" : "Create and Send Activation"} loading={pending} onClose={() => { if (!pending) { setConfirmation(null); onBusyChange(false); } }} onConfirm={saveConfirmed}>
      {confirmation ? <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold">{String(confirmation.get("firstName"))} {String(confirmation.get("lastName"))}</p>
        <p>{account?.email ?? String(confirmation.get("email"))}</p>
        <table className="w-full text-left"><thead><tr><th className="pb-2">Assignment</th>{account ? <th className="pb-2">Current</th> : null}<th className="pb-2">{account ? "New" : "Approved"}</th></tr></thead><tbody>
          {([['role', 'Role'], ['organization', 'Organization'], ['barangay', 'Barangay'], ['utilityCompany', 'Utility Company'], ['repairOrganization', 'Repair Organization']] as const).map(([key, label]) => <tr key={key}><th className="py-1 pr-3 font-medium">{label}</th>{account ? <td className="py-1 pr-3 break-words">{key === 'role' ? accountRoleLabels[account.role] : account[key] || '—'}</td> : null}<td className="py-1 break-words">{key === 'role' ? accountRoleLabels[String(confirmation.get(key)) as AuthorizedAccount['role']] : String(confirmation.get(key) || '—')}</td></tr>)}
        </tbody></table>
        <p><span className="font-medium">Approval Reference: </span>{String(confirmation.get('approvalReference'))}</p>
      </div> : null}
    </ConfirmationDialog></form>;
}
