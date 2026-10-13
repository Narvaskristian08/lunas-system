"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { X } from "lucide-react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    loadFalseReportReview(incidentId).then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setMessage("Review unavailable. Reload to retry."); });
    return () => { active = false; };
  }, [incidentId]);

  useEffect(() => {
    if (!modalOpen) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setModalOpen(false);
        setConfirming(false);
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus();
    };
  }, [modalOpen, pending]);

  const correcting = data?.review?.finding === "confirmed_fabrication";
  const canRecord = role === "barangay_official";
  const canCorrect = role === "city_engineer" || role === "admin";
  const canOpen = Boolean(data && ((status === "rejected" && canRecord) || (correcting && canCorrect)));
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

      {modalOpen && data ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="false-report-review-title" aria-describedby="false-report-review-description" className="max-h-[min(820px,calc(100vh-2rem))] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-700">{correcting ? "Correct an Existing Finding" : "Barangay Review Action"}</p>
              <h2 id="false-report-review-title" className="mt-1 text-xl font-bold text-slate-950">{correcting ? "Correct False-Report Finding" : "Document False-Report Finding"}</h2>
            </div>
            <button ref={closeRef} type="button" onClick={closeModal} disabled={pending} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close false-report review dialog"><X className="size-5" aria-hidden="true" /></button>
          </div>
          <p id="false-report-review-description" className="mt-3 text-sm leading-6 text-slate-600">{correcting ? "Record why the existing finding is being corrected. The audit history remains available." : "Only document deliberate fabrication when the rejection decision and cited evidence support it. A rejection, duplicate, or GPS mismatch alone is not a fabrication finding."}</p>
          <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-950">
            <p><span className="font-semibold">Reporter findings:</span> {data.confirmedFindingsTotal ?? data.confirmedFindingsInScope} / 3</p>
            <p className="mt-1"><span className="font-semibold">Assigned Barangay:</span> This review uses the incident’s assigned Barangay and cannot be changed here.</p>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-slate-800">{correcting ? "Correction Reason" : "Evidence Supporting Deliberate Fabrication"}<textarea className={`${fieldClass()} min-h-32`} value={reason} onChange={(event) => { setReason(event.target.value); setConfirming(false); }} required minLength={20} maxLength={2000} disabled={pending} /></label>
            <label className="block text-sm font-semibold text-slate-800">Evidence or Documented Decision Reference<input className={fieldClass()} value={evidenceReference} onChange={(event) => { setEvidence(event.target.value); setConfirming(false); }} required maxLength={500} disabled={pending} /></label>
            {confirming ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Confirm that you reviewed the cited evidence and documented this {correcting ? "correction" : "finding"}.</p> : null}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button className="min-h-12" type="button" variant="secondary" onClick={closeModal} disabled={pending}>Cancel</Button>
              <Button className="min-h-12" type="submit" loading={pending} loadingLabel="Saving…">{confirming ? "Confirm Reviewed Decision" : correcting ? "Continue to Correction" : "Continue to Record Finding"}</Button>
            </div>
          </form>
        </div>
      </div> : null}
    </>
  );
}
