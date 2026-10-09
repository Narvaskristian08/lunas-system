"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { loadFalseReportReview, saveFalseReportReview, type ReviewData } from "@/app/actions/false-report-review";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FalseReportReview({ incidentId, status }: { incidentId: string; status: string }) {
  const [data, setData] = useState<ReviewData>();
  const [reason, setReason] = useState("");
  const [evidenceReference, setEvidence] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    let active = true;
    loadFalseReportReview(incidentId).then((value) => { if (active) setData(value); })
      .catch(() => { if (active) setMessage("Review unavailable. Reload to retry."); });
    return () => { active = false; };
  }, [incidentId]);
  const correcting = data?.review?.finding === "confirmed_fabrication";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!confirming) { setConfirming(true); return; }
    startTransition(async () => {
      const result = await saveFalseReportReview(incidentId, {
        finding: correcting ? "corrected" : "confirmed_fabrication", reason, evidenceReference,
        expectedVersion: data?.review?.version ?? 0,
      });
      setMessage(result.message);
      setConfirming(false);
      try { setData(await loadFalseReportReview(incidentId)); } catch { setMessage("Reload to see the latest review."); }
      if (result.ok) { setReason(""); setEvidence(""); }
    });
  };
  return <Card><CardHeader title="Documented False-Report Review" description="Rejections, duplicates, unverifiable locations, and GPS mismatch do not establish deliberate fabrication. Findings require evidence and human review; no automatic punishment applies." />
    <div className="space-y-3 p-5 text-sm">
      {message ? <p role="status">{message}</p> : null}
      {!data ? <p>Loading review...</p> : <>
        <p>Active documented findings for this reporter within your jurisdiction: {data.confirmedFindingsInScope}</p>
        <p>Current Review: {correcting ? "Confirmed Fabrication Finding" : "No Active Fabrication Finding"}</p>
        {data.review?.history.map((entry, index) => <div key={index} className="rounded border p-3"><p>{entry.finding === "corrected" ? "Finding Corrected" : "Documented Finding"} - {entry.reviewedAt}</p><p>{entry.reason}</p><p>Evidence Reference: {entry.evidenceReference}</p></div>)}
        {(status === "rejected" || correcting) ? <form onSubmit={submit} className="space-y-3">
          <label className="block">{correcting ? "Correction Reason" : "Evidence Supporting Deliberate Fabrication"}<textarea className="block w-full rounded border p-2" value={reason} onChange={(event) => { setReason(event.target.value); setConfirming(false); }} required minLength={20} maxLength={2000} disabled={pending} /></label>
          <label className="block">Evidence or Documented Decision Reference<input className="block w-full rounded border p-2" value={evidenceReference} onChange={(event) => { setEvidence(event.target.value); setConfirming(false); }} required maxLength={500} disabled={pending} /></label>
          {confirming ? <p role="alert">Confirm that you reviewed the cited evidence and documented this {correcting ? "correction" : "finding"}. This does not change the incident status or restrict the account.</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : confirming ? "Confirm Reviewed Decision" : correcting ? "Correct Erroneous Finding" : "Record Reviewed Finding"}</Button>
        </form> : <p>A finding can only be recorded after a separate rejection decision.</p>}
      </>}
    </div>
  </Card>;
}
