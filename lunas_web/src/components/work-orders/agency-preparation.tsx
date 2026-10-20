"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAgencyPreparationAction } from "@/app/actions/tanod-workflow";
import type { ProviderRoutedIncident } from "@/lib/work-orders.server";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const nextMilestones: Record<string, string[]> = {
  pending_external_processing: ["pending_funding", "for_bidding", "awaiting_work_authorization"],
  pending_funding: ["for_bidding", "awaiting_work_authorization"],
  for_bidding: ["bidding_completed"], bidding_completed: ["awaiting_work_authorization"],
};

export function AgencyPreparationPanel({ incident }: { incident: ProviderRoutedIncident }) {
  const preparation = incident.agencyPreparation;
  const [outcome, setOutcome] = useState("routine");
  const [notes, setNotes] = useState("");
  const [requirements, setRequirements] = useState("");
  const [resources, setResources] = useState("");
  const [approach, setApproach] = useState("");
  const [processType, setProcessType] = useState("");
  const [milestone, setMilestone] = useState("");
  const [reference, setReference] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const send = (operation: "acknowledge" | "assess" | "external") => startTransition(async () => {
    const body = operation === "assess" ? { outcome, notes, requirements, resources, approach, processType, reference }
      : operation === "external" ? { milestone, remarks: notes, reference, ...(followUpAt ? { followUpAt: new Date(followUpAt).toISOString() } : {}) } : {};
    const result = await updateAgencyPreparationAction(incident.id, { ...body, operation, expectedVersion: preparation?.revision ?? 0 });
    setMessage(result.message);
    if (result.ok) { setMilestone(""); router.refresh(); }
  });
  const acknowledged = Boolean(preparation?.acknowledgedAt);
  const inputClass = "w-full rounded border border-slate-300 p-2 text-sm";
  return <Card className="mb-5 overflow-hidden">
    <CardHeader title="Agency preparation" description="Record receipt, assessment and applicable outside-process milestones." />
    <div className="space-y-4 p-5">
      <p>Current status: {incident.agencyStatus === "not_routed" && incident.responsibleOrganization ? "awaiting agency acknowledgment" : (incident.agencyStatus || "not_routed").replaceAll("_", " ")}</p>
      <p>Organization: {incident.responsibleOrganization || "Unavailable"}</p>
      <p>Maintenance authorization: policy pending. Receiving, assessment and bidding completion do not permit repair.</p>
      {preparation?.outcome === "responsibility_review" ? <p>Responsibility dispute recorded. Await authorized jurisdiction review; ownership is unchanged.</p> : !acknowledged ? <Button disabled={pending} onClick={() => send("acknowledge")}>Acknowledge agency receipt</Button> : <>
        <p>Receipt acknowledged: {preparation?.acknowledgedAt}</p>
        <label className="block">Assessment outcome<select aria-label="Assessment outcome" className={inputClass} value={outcome} onChange={event => setOutcome(event.target.value)}>
          <option value="routine">Routine maintenance</option><option value="external">External processing required</option><option value="responsibility_review">Responsibility requires review</option><option value="clarification">Assessment requires clarification</option>
        </select></label>
        <label className="block">Assessment notes / milestone remarks<textarea aria-label="Assessment notes / milestone remarks" className={inputClass} maxLength={4000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
        <label className="block">Maintenance requirements<textarea className={inputClass} maxLength={2000} value={requirements} onChange={event => setRequirements(event.target.value)} /></label>
        <label className="block">Resource availability<textarea className={inputClass} maxLength={2000} value={resources} onChange={event => setResources(event.target.value)} /></label>
        <label className="block">Recommended approach<textarea className={inputClass} maxLength={2000} value={approach} onChange={event => setApproach(event.target.value)} /></label>
        {outcome === "external" && <label className="block">External process type<input className={inputClass} maxLength={120} value={processType} onChange={event => setProcessType(event.target.value)} /></label>}
        <label className="block">Official reference (optional)<input className={inputClass} maxLength={200} value={reference} onChange={event => setReference(event.target.value)} /></label>
        <Button disabled={pending || [notes, requirements, resources, approach].some(value => value.trim().length < 2) || (outcome === "external" && processType.trim().length < 2)} onClick={() => send("assess")}>Record assessment</Button>
        {preparation?.outcome === "external" && <fieldset className="space-y-3"><legend>External-process tracking</legend>
          <p>Current milestone: {preparation.milestone?.replaceAll("_", " ")}</p>
          <label className="block">Next external milestone<select aria-label="Next external milestone" className={inputClass} value={milestone} onChange={event => setMilestone(event.target.value)}><option value="">Select applicable milestone</option>{(nextMilestones[preparation.milestone || ""] || []).map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
          <label className="block">Expected follow-up (optional)<input type="datetime-local" className={inputClass} value={followUpAt} onChange={event => setFollowUpAt(event.target.value)} /></label>
          <Button disabled={pending || !milestone || notes.trim().length < 2 || notes.trim().length > 2000} onClick={() => send("external")}>Record external milestone</Button>
        </fieldset>}
      </>}
      <Button disabled>Authorize work — policy pending</Button><Button disabled>Ready for maintenance — policy pending</Button>
      <details><summary>Assessment and preparation history</summary>
        {(preparation?.assessments || []).map((item, index) => <p key={index}>{item.notes} · Requirements: {item.requirements} · Resources: {item.resources} · Approach: {item.approach}</p>)}
        <ol>{(preparation?.history || []).map((event, index) => <li key={index}>{event.at} · {event.organization} · {event.actor} · {event.operation} · {event.status?.replaceAll("_", " ")} · {event.remarks} {event.reference ? `(${event.reference})` : ""}</li>)}</ol>
        <ul>{(preparation?.externalHistory || []).map((event, index) => <li key={index}>{event.previous} to {event.milestone}: {event.remarks} {event.reference} {event.followUpAt ? `Follow-up: ${event.followUpAt}` : ""}</li>)}</ul>
      </details>
      {message && <p role="status">{message}</p>}
    </div>
  </Card>;
}
