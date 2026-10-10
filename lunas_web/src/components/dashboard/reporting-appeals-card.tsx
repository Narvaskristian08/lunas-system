"use client";

import { useState, useTransition } from "react";
import { reviewReportingAppeal } from "@/app/actions/reporting-appeals";
import type { DashboardReportingAppeal } from "@/lib/dashboard.server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

export function ReportingAppealsCard({ initialAppeals }: { initialAppeals: DashboardReportingAppeal[] }) {
  const [appeals, setAppeals] = useState(initialAppeals);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const decide = (appeal: DashboardReportingAppeal, decision: "approved" | "rejected") => {
    if (pending) return;
    setMessage("");
    setPendingId(appeal.id);
    startTransition(async () => {
      const result = await reviewReportingAppeal({
        appealId: appeal.id,
        decision,
        expectedVersion: appeal.version,
      });
      setMessage(result.message);
      if (result.ok) setAppeals((current) => current.filter((item) => item.id !== appeal.id));
      setPendingId(null);
    });
  };

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader
        title="Reporting Appeals"
        description="Account-level requests from users whose new report submissions are paused."
      />
      {message ? <p role="status" className="mx-5 mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p> : null}
      {!appeals.length ? <div className="p-5 text-sm text-slate-600">No pending account appeals. Approved and rejected decisions remain in the audit history.</div> : (
        <div className="divide-y divide-slate-200">
          {appeals.map((appeal) => {
            const reporterName = [appeal.reporter?.firstName, appeal.reporter?.lastName].filter(Boolean).join(" ") || "Citizen account";
            const isPending = pendingId === appeal.id;
            return (
              <article key={appeal.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{reporterName}</h3>
                    {appeal.reporter?.email ? <p className="mt-0.5 text-xs text-slate-500">{appeal.reporter.email}</p> : null}
                    <p className="mt-1 text-sm text-slate-600">Assigned Barangay: <span className="font-semibold text-slate-800">{appeal.assignedBarangay}</span></p>
                  </div>
                  <StatusBadge tone="warning">Pending Review</StatusBadge>
                </div>
                <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div><p className="font-semibold text-slate-800">Explanation</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{appeal.explanation}</p></div>
                  <div><p className="font-semibold text-slate-800">Supporting evidence/reference</p><p className="mt-1 whitespace-pre-wrap text-slate-700">{appeal.evidenceReference}</p></div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="sm" onClick={() => decide(appeal, "approved")} loading={isPending && pending} loadingLabel="Saving…" disabled={pending}>Approve &amp; Clear Block</Button>
                  <Button size="sm" variant="danger" onClick={() => decide(appeal, "rejected")} disabled={pending}>Reject Appeal</Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
