"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bug, Mail, ShieldCheck } from "lucide-react";
import { createSupportTicketAction } from "@/app/actions/support-tickets";
import { EmptyState } from "@/components/states/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { SupportTicket, SupportTicketCategory, SupportTicketPage } from "@/lib/support-tickets.server";
import { formatDateTime } from "@/lib/utils";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
const categoryLabels: Record<SupportTicketCategory, string> = {
  bug: "Bug or error",
  account_access: "Account access",
  data_issue: "Incorrect or missing data",
  feature_request: "Feature request",
  other: "Other issue",
};

function tone(ticket: SupportTicket) {
  if (ticket.status === "resolved") return "success" as const;
  if (ticket.status === "closed") return "neutral" as const;
  if (ticket.priority === "urgent" || ticket.priority === "high") return "critical" as const;
  if (ticket.status === "in_progress") return "information" as const;
  return "warning" as const;
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function SupportTicketCenter({ initialData, initialError }: { initialData: SupportTicketPage; initialError?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError ?? "");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await createSupportTicketAction(form);
        if (!result.ok) { setError(result.message); return; }
        setMessage(result.message);
        event.currentTarget.reset();
        router.refresh();
      } catch { setError("The support service could not be reached. Refresh before retrying."); }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Mail className="size-5" aria-hidden="true" /></span>
          <div>
            <h2 className="font-semibold text-slate-950">Submit a support ticket</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Describe what happened and an administrator will review it. Never include a password, reset link, verification code, or secret key.</p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Issue type<select name="category" className={inputClass} defaultValue="bug"><option value="bug">Bug or error</option><option value="account_access">Account access</option><option value="data_issue">Incorrect or missing data</option><option value="feature_request">Feature request</option><option value="other">Other issue</option></select></label>
          <label className="text-sm font-medium text-slate-700">Priority<select name="priority" className={inputClass} defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Subject<input name="subject" className={inputClass} required minLength={5} maxLength={160} placeholder="Short description of the issue" /></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">Description<textarea name="description" className={`${inputClass} min-h-32`} required minLength={20} maxLength={4000} placeholder="Include the page, action, and error message if available." /></label>
          <div className="md:col-span-2"><Button type="submit" loading={pending} loadingLabel="Submitting…"><Bug className="size-4" aria-hidden="true" />Submit ticket</Button></div>
        </form>
        {message ? <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <div className="mt-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />Support staff will never ask for your password, reset link, or verification code.</div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="My support tickets" description={`${initialData.pagination.total} ticket${initialData.pagination.total === 1 ? "" : "s"} submitted from this account.`} />
        {initialError ? <EmptyState icon="data" title="Tickets unavailable" description={initialError} /> : initialData.records.length ? <div className="divide-y divide-slate-200">{initialData.records.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}</div> : <EmptyState icon="search" title="No support tickets yet" description="Submitted bugs and other issues will appear here with their current status." />}
      </Card>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  return <article className="p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold tracking-wide text-brand-700">{ticket.ticketNumber}</p><h3 className="mt-1 text-base font-semibold text-slate-950">{ticket.subject}</h3><p className="mt-1 text-sm text-slate-500">{categoryLabels[ticket.category]} · {formatDateTime(ticket.createdAt)}</p></div>
      <div className="flex flex-wrap gap-2"><StatusBadge tone={tone(ticket)}>{label(ticket.status)}</StatusBadge><StatusBadge tone={ticket.priority === "urgent" || ticket.priority === "high" ? "critical" : "neutral"}>{label(ticket.priority)} priority</StatusBadge></div>
    </div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.description}</p>
    {ticket.adminResponse ? <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><p className="font-semibold">Administrator response</p><p className="mt-1 whitespace-pre-wrap">{ticket.adminResponse}</p></div> : null}
  </article>;
}
