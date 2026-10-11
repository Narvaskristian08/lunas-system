"use client";

import { useEffect, useState, useTransition } from "react";
import { loadReportingAppeal, reviewReportingAppeal, type ReportingAppeal } from "@/app/actions/reporting-appeals";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

export function ReportingAppealReview({ reporterId, role }: { reporterId?: string; role: string }) {
  const [appeal, setAppeal] = useState<ReportingAppeal | null>();
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!reporterId) return;
    let active = true;
    loadReportingAppeal(reporterId).then(value => { if (active) setAppeal(value); })
      .catch(() => { if (active) setMessage("Appeal status unavailable. Reload to retry."); });
    return () => { active = false; };
  }, [reporterId]);

  if (!reporterId || (!appeal && !message)) return null;
  const canReview = role === "barangay_official";
  const submit = (decision: "approved" | "rejected") => {
    if (!appeal || pending) return;
    startTransition(async () => {
      const result = await reviewReportingAppeal({ appealId: appeal.id, decision, notes, expectedVersion: appeal.version });
      setMessage(result.message);
      if (result.ok) setAppeal({ ...appeal, status: decision, reviewNotes: notes });
    });
  };

  return <Card><CardHeader title="Reporting Appeal" description="The reporter can submit an explanation and supporting evidence reference. No new file upload is required." />
    <div className="space-y-3 p-5 text-sm">
      {message ? <p role="status" className="rounded-lg bg-slate-50 p-3">{message}</p> : null}
      {appeal ? <>
        <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-slate-500">Assigned Barangay</dt><dd className="font-semibold">{appeal.assignedBarangay}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="font-semibold capitalize">{appeal.status}</dd></div></dl>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-semibold">Explanation</p><p className="mt-1 whitespace-pre-wrap">{appeal.explanation}</p><p className="mt-3 font-semibold">Supporting evidence/reference</p><p className="mt-1">{appeal.evidenceReference}</p></div>
        {appeal.status === "pending" && canReview ? <>
          <label className="block font-semibold">Review notes <span className="font-normal text-slate-500">(Optional)</span><textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-2" disabled={pending} /></label>
          <div className="grid gap-2 sm:grid-cols-2"><Button onClick={() => submit("approved")} disabled={pending}>Approve &amp; Clear Block</Button><Button variant="danger" onClick={() => submit("rejected")} disabled={pending}>Reject Appeal</Button></div>
        </> : null}
      </> : null}
    </div>
  </Card>;
}
