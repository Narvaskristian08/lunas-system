"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { loadFalseReportReview, saveFalseReportReview, type ReviewData } from "@/app/actions/false-report-review";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function fieldClass() {
  return "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70";
}

export function FalseReportReview({ incidentId, status, role }: { incidentId: string; status: string; role: string }) {
  const [data, setData] = useState<ReviewData>();
  const [reason, setReason] = useState("");
  const [evidenceReference, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let active = true;
    loadFalseReportReview(incidentId).then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setMessage("Review unavailable. Reload to retry."); });
    return () => { active = false; };
  }, [incidentId]);



  const correcting = data?.review?.finding === "confirmed_fabrication";
  const canRecord = role === "barangay_official";
  const canCorrect = role === "city_engineer" || role === "admin";
  const canOpen = Boolean(data && (correcting ? canCorrect : status === "rejected" && canRecord));
  const latestHistory = data?.review?.history.at(-1);

  const openModal = () => {
    setMessage("");
    setConfirming(false);
    setReason("");
    setEvidence("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (pending) return;
    setModalOpen(false);
    setConfirming(false);
    setReason("");
    setEvidence("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await saveFalseReportReview(incidentId, {
        finding: correcting ? "corrected" : "confirmed_fabrication", reason, evidenceReference,
        expectedVersion: data.review?.version ?? 0,
      });
      setMessage(result.message);
      setConfirming(false);
      if (result.ok) {
        setReason("");
        setEvidence("");
        setModalOpen(false);
      }
      try { setData(await loadFalseReportReview(incidentId)); } catch { setMessage("Reload to see the latest review."); }
    });
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Documented False-Report Review"
          description="Rejections, duplicates, unverifiable locations, and GPS mismatch do not establish deliberate fabrication. Active findings pause new submissions after the third."
          action={canOpen ? <Button type="button" size="sm" onClick={openModal}>{correcting ? "Correct Finding" : "Document Finding"}</Button> : undefined}
        />
        <div className="space-y-4 p-5 text-sm">
          {message ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">{message}</p> : null}
          {!data ? <p>Loading review...</p> : <>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-slate-600">Active documented findings</dt><dd className="mt-1 text-lg font-bold text-slate-950">{data.confirmedFindingsTotal ?? data.confirmedFindingsInScope} <span className="text-sm font-medium text-slate-500">/ 3</span></dd></div>
              <div><dt className="text-slate-600">Current review</dt><dd className="mt-1"><Badge tone={correcting ? "warning" : "neutral"}>{correcting ? "Confirmed Fabrication Finding" : "No Active Fabrication Finding"}</Badge></dd></div>
            </dl>
            {latestHistory ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">Latest documented decision</p>
              <p className="mt-1 text-slate-700">{latestHistory.reason}</p>
              <p className="mt-2 text-xs text-slate-600">Evidence/reference: <span className="font-medium text-slate-800">{latestHistory.evidenceReference}</span></p>
            </div> : null}
            {data.review?.history.length ? <details className="rounded-xl border border-slate-200">
              <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-800">View review history ({data.review.history.length})</summary>
              <div className="space-y-3 border-t border-slate-200 p-4">{data.review.history.map((entry, index) => <div key={`${entry.reviewedAt}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3"><p className="font-semibold text-slate-900">{entry.finding === "corrected" ? "Finding Corrected" : "Documented Finding"} · {entry.reviewedAt}</p><p className="mt-1 text-slate-700">{entry.reason}</p><p className="mt-1 text-xs text-slate-600">Evidence/reference: {entry.evidenceReference}</p></div>)}</div>
            </details> : null}
            {!canOpen ? <p className="text-slate-600">{correcting ? "Only City Engineering or Admin can correct an active finding." : status === "rejected" ? "Only the assigned Barangay Official can record the initial finding." : "A finding can only be recorded after a separate rejection decision."}</p> : null}
          </>}
        </div>
      </Card>

      {data ? <ConfirmationDialog
        open={modalOpen}
        icon="none"
        title={correcting ? "Correct False-Report Finding" : "Document False-Report Finding"}
        description={correcting ? "Record why the existing finding is being corrected. The audit history remains available." : "Only document deliberate fabrication when the rejection decision and cited evidence support it. A rejection, duplicate, or GPS mismatch alone is not a fabrication finding."}
        confirmLabel={confirming ? "Confirm Reviewed Decision" : correcting ? "Continue to Correction" : "Continue to Record Finding"}
        loading={pending}
        onClose={closeModal}
        onConfirm={() => formRef.current?.requestSubmit()}
      >
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-950">
            <p><span className="font-semibold">Reporter findings:</span> {data.confirmedFindingsTotal ?? data.confirmedFindingsInScope} / 3</p>
            <p className="mt-1"><span className="font-semibold">Assigned Barangay:</span> This review uses the incident’s assigned Barangay and cannot be changed here.</p>
          </div>
          <form ref={formRef} onSubmit={submit} className="mt-4 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">{correcting ? "Correction Reason" : "Evidence Supporting Deliberate Fabrication"}<textarea className={`${fieldClass()} min-h-32`} value={reason} onChange={(event) => { setReason(event.target.value); setConfirming(false); }} required minLength={20} maxLength={2000} disabled={pending} /></label>
            <label className="block text-sm font-semibold text-slate-800">Evidence or Documented Decision Reference<input className={fieldClass()} value={evidenceReference} onChange={(event) => { setEvidence(event.target.value); setConfirming(false); }} required maxLength={500} disabled={pending} /></label>
            {confirming ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Confirm that you reviewed the cited evidence and documented this {correcting ? "correction" : "finding"}.</p> : null}

          </form>
      </ConfirmationDialog> : null}
    </>
  );
}
