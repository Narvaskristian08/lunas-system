"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/states/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { updateSupportTicketAction } from "@/app/actions/support-tickets";
import type { SupportTicket, SupportTicketCategory, SupportTicketPage, SupportTicketStatus } from "@/lib/support-tickets.server";
import { formatDateTime } from "@/lib/utils";

const inputClass = "mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const statuses = ["open", "in_progress", "resolved", "closed"] as const;
const categories = ["bug", "account_access", "data_issue", "feature_request", "other"] as const;
const categoryLabels: Record<SupportTicketCategory, string> = { bug: "Bug or error", account_access: "Account access", data_issue: "Data issue", feature_request: "Feature request", other: "Other issue" };

function label(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }
function statusTone(status: SupportTicketStatus) { return status === "resolved" ? "success" as const : status === "closed" ? "neutral" as const : status === "in_progress" ? "information" as const : "warning" as const; }

export function AdminSupportTicketQueue({ data, filters, error }: { data: SupportTicketPage; filters: { status: SupportTicketStatus | ""; category: SupportTicketCategory | "" }; error?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const page = data.pagination.page;
  const filterQuery = new URLSearchParams();
  if (filters.status) filterQuery.set("status", filters.status);
  if (filters.category) filterQuery.set("category", filters.category);
  const pageHref = (next: number) => { const query = new URLSearchParams(filterQuery); query.set("page", String(next)); return `/admin/tickets?${query}`; };

  function submit(id: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage(""); setActionError("");
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await updateSupportTicketAction(id, form);
        if (!result.ok) { setActionError(result.message); return; }
        setMessage(result.message); router.refresh();
      } catch { setActionError("The support service could not be reached. Refresh before retrying."); }
    });
  }

  return <div className="space-y-5">
    <Card className="p-4">
      <form method="get" className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-sm font-semibold text-slate-700">Status<select name="status" defaultValue={filters.status} className={inputClass}><option value="">All statuses</option>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Issue type<select name="category" defaultValue={filters.category} className={inputClass}><option value="">All issue types</option>{categories.map(value => <option key={value} value={value}>{categoryLabels[value]}</option>)}</select></label>
        <Button type="submit" variant="secondary" className="self-end">Apply filters</Button>
      </form>
    </Card>
    {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p> : null}
    {actionError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{actionError}</p> : null}
    <Card className="overflow-hidden">
      <CardHeader title="Incoming tickets" description={`${data.pagination.total} ticket${data.pagination.total === 1 ? "" : "s"}. Updates are recorded in the security audit trail.`} />
      {error ? <EmptyState icon="data" title="Tickets unavailable" description={error} /> : data.records.length ? <div className="divide-y divide-slate-200">{data.records.map(ticket => <TicketCard key={ticket.id} ticket={ticket} pending={pending} onSubmit={submit} />)}</div> : <EmptyState icon="search" title="No support tickets" description="No tickets match the selected filters." />}
      {!error && data.pagination.pages > 1 ? <nav className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm" aria-label="Support ticket pages">{page > 1 ? <Link href={pageHref(page - 1)} className="font-semibold text-brand-700">Previous</Link> : <span /> }<span className="text-slate-600">Page {page} of {data.pagination.pages}</span>{page < data.pagination.pages ? <Link href={pageHref(page + 1)} className="font-semibold text-brand-700">Next</Link> : <span />}</nav> : null}
    </Card>
  </div>;
}

function TicketCard({ ticket, pending, onSubmit }: { ticket: SupportTicket; pending: boolean; onSubmit: (id: string, event: React.FormEvent<HTMLFormElement>) => void }) {
  return <article className="p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-brand-700">{ticket.ticketNumber}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{ticket.subject}</h3><p className="mt-1 text-sm text-slate-500">{ticket.requester?.name || "Unknown requester"} · {ticket.requester?.email || "No email"} · {ticket.requester?.role || "User"}</p><p className="mt-1 text-xs text-slate-500">{categoryLabels[ticket.category]} · Submitted {formatDateTime(ticket.createdAt)}</p></div>
      <div className="flex flex-wrap gap-2"><StatusBadge tone={statusTone(ticket.status)}>{label(ticket.status)}</StatusBadge><StatusBadge tone={ticket.priority === "urgent" || ticket.priority === "high" ? "critical" : "neutral"}>{label(ticket.priority)} priority</StatusBadge></div>
    </div>
    <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p></div>
    <form onSubmit={event => onSubmit(ticket.id, event)} className="mt-5 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-[1fr_1fr]">
      <label className="text-sm font-medium text-slate-700">Status<select name="status" defaultValue={ticket.status} className={inputClass}>{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-700">Priority<select name="priority" defaultValue={ticket.priority} className={inputClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">Administrator response<textarea name="adminResponse" defaultValue={ticket.adminResponse || ""} maxLength={4000} className={`${inputClass} min-h-24`} placeholder="Write an update or resolution for the requester." /></label>
      <div className="md:col-span-2"><Button type="submit" loading={pending} loadingLabel="Saving…">Save ticket update</Button></div>
    </form>
  </article>;
}
