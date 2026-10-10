"use client";

import { useState, useTransition } from "react";
import { reviewReportingAppeal, type ReportingAppeal, type ReportingAppealPage } from "@/app/actions/reporting-appeals";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

export function ReportingAppealsConsole({ data }: { data: ReportingAppealPage }) {
  const [appeals, setAppeals] = useState<ReportingAppeal[]>(data.appeals);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const decide = (appeal: ReportingAppeal, decision: "approved" | "rejected") => {
    if (pending) return;
    startTransition(async () => {
      const result = await reviewReportingAppeal({ appealId: appeal.id, decision, expectedVersion: appeal.version });
      setMessage(result.message);
      if (result.ok) setAppeals(current => current.filter(item => item.id !== appeal.id));
    });
  };
  return <div className="mx-auto max-w-[1200px] space-y-6">
    <div><p className="text-sm font-semibold text-brand-700">LUNAS · Reporting restrictions</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Reporting appeals</h1><p className="mt-2 text-slate-600">Admin override queue for users whose new report submissions are paused.</p></div>
    {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">{message}</p> : null}
    {!appeals.length ? <Card><CardHeader title="No pending appeals" description="Approved and rejected appeals remain in the audit history." /></Card> : appeals.map(appeal => <Card key={appeal.id}><CardHeader title={`${appeal.reporter?.firstName || "Citizen"} ${appeal.reporter?.lastName || ""}`} description={`Assigned Barangay: ${appeal.assignedBarangay}`} /><div className="space-y-3 p-5 text-sm"><div><p className="font-semibold">Explanation</p><p className="mt-1 whitespace-pre-wrap">{appeal.explanation}</p></div><div><p className="font-semibold">Supporting evidence/reference</p><p className="mt-1">{appeal.evidenceReference}</p></div><div className="flex gap-2"><Button onClick={() => decide(appeal, "approved")} disabled={pending}>Approve &amp; Clear Block</Button><Button variant="danger" onClick={() => decide(appeal, "rejected")} disabled={pending}>Reject Appeal</Button></div></div></Card>)}
  </div>;
}
