"use client";

import { useState, useTransition } from "react";
import { loadReportingAppealHistory, reviewReportingAppeal, type ReportingAppealPage } from "@/app/actions/reporting-appeals";
import type { DashboardReportingAppeal } from "@/lib/dashboard.server";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

type AppealTab = "pending" | "history";

function reporterName(appeal: DashboardReportingAppeal) {
  return [appeal.reporter?.firstName, appeal.reporter?.lastName].filter(Boolean).join(" ") || "Citizen account";
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function historyStatus(appeal: ReportingAppealPage["appeals"][number]) {
  return appeal.status === "approved"
    ? <StatusBadge tone="success">Approved</StatusBadge>
    : <StatusBadge tone="critical">Rejected</StatusBadge>;
}

export function ReportingAppealsCard({ initialAppeals }: { initialAppeals: DashboardReportingAppeal[] }) {
  const [appeals, setAppeals] = useState(initialAppeals);
  const [activeTab, setActiveTab] = useState<AppealTab>("pending");
  const [history, setHistory] = useState<ReportingAppealPage | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [message, setMessage] = useState("");
  const [isHistoryPending, startHistoryTransition] = useTransition();
  const [isDecisionPending, startDecisionTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadHistory = (page: number) => {
    setHistoryError("");
    startHistoryTransition(async () => {
      try {
        const result = await loadReportingAppealHistory(page);
        setHistory(result);
        setHistoryPage(result.pagination.page);
      } catch {
        setHistoryError("Completed appeal history could not be loaded. Try again.");
      }
    });
  };

  const selectTab = (tab: AppealTab) => {
    setActiveTab(tab);
    if (tab === "history") loadHistory(historyPage);
  };

  const decide = (appeal: DashboardReportingAppeal, decision: "approved" | "rejected") => {
    if (isDecisionPending) return;
    setMessage("");
    setPendingId(appeal.id);
    startDecisionTransition(async () => {
      const result = await reviewReportingAppeal({
        appealId: appeal.id,
        decision,
        expectedVersion: appeal.version,
      });
      setMessage(result.message);
      if (result.ok) {
        setAppeals((current) => current.filter((item) => item.id !== appeal.id));
        setHistory(null);
      }
      setPendingId(null);
    });
  };

  return (
    <Card className="mt-6 overflow-hidden">
      <CardHeader
        title="Reporting Appeals"
        description="Account-level requests from users whose new report submissions are paused."
      />
      <div className="flex gap-1 border-b border-slate-200 px-5 pt-3" role="tablist" aria-label="Reporting appeal views">
        {(["pending", "history"] as AppealTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`reporting-appeals-${tab}`}
            className={`border-b-2 px-3 py-2 text-sm font-semibold transition ${activeTab === tab
              ? "border-brand-700 text-brand-800"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"}`}
            onClick={() => selectTab(tab)}
          >
            {tab === "pending" ? "Pending" : "History"}
          </button>
        ))}
      </div>
      {message && activeTab === "pending" ? <p role="status" className="mx-5 mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">{message}</p> : null}

      {activeTab === "pending" ? (
        <div id="reporting-appeals-pending" role="tabpanel" aria-label="Pending reporting appeals">
          {!appeals.length ? <div className="p-5 text-sm text-slate-600">No pending account appeals.</div> : (
            <div className="divide-y divide-slate-200">
              {appeals.map((appeal) => {
                const isPending = pendingId === appeal.id;
                return (
                  <article key={appeal.id} className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{reporterName(appeal)}</h3>
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
                      <Button size="sm" onClick={() => decide(appeal, "approved")} loading={isPending && isDecisionPending} loadingLabel="Saving…" disabled={isDecisionPending}>Approve &amp; Clear Block</Button>
                      <Button size="sm" variant="danger" onClick={() => decide(appeal, "rejected")} disabled={isDecisionPending}>Reject Appeal</Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div id="reporting-appeals-history" role="tabpanel" aria-label="Completed reporting appeals">
          {historyError ? <div role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{historyError}</div> : null}
          {isHistoryPending && !history ? <div className="p-5 text-sm text-slate-600" role="status">Loading completed appeal history…</div> : null}
          {!isHistoryPending && history && !history.appeals.length ? <div className="p-5 text-sm text-slate-600">No completed appeals yet.</div> : null}
          {history?.appeals.length ? (
            <div className="divide-y divide-slate-200">
              {history.appeals.map((appeal) => (
                <article key={appeal.id} className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{reporterName(appeal)}</h3>
                      {appeal.reporter?.email ? <p className="mt-0.5 text-xs text-slate-500">{appeal.reporter.email}</p> : null}
                      <p className="mt-1 text-sm text-slate-600">Assigned Barangay: <span className="font-semibold text-slate-800">{appeal.assignedBarangay}</span></p>
                    </div>
                    {historyStatus(appeal)}
                  </div>
                  <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div><dt className="font-semibold text-slate-800">Decision date</dt><dd className="mt-1 text-slate-700">{formatDate(appeal.reviewedAt ?? appeal.createdAt)}</dd></div>
                    <div><dt className="font-semibold text-slate-800">Decision notes</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{appeal.reviewNotes || "No notes recorded."}</dd></div>
                  </dl>
                </article>
              ))}
              <Pagination
                page={history.pagination.page}
                pages={history.pagination.pages}
                total={history.pagination.total}
                pageSize={history.pagination.limit}
                onPageChange={loadHistory}
              />
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
