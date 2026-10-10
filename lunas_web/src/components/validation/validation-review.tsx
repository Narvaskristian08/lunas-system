"use client";

import { categoryLabel } from "@/lib/category-label";

/* Signed private evidence URLs are dynamic and intentionally not passed to Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TimelineMarker } from "@/components/ui/timeline-marker";
import { distinctTimelineEvents, timelineEventLabel, timelineMilestoneLabel, timelineNoteLabel } from "@/lib/timeline-display";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, FileImage, MapPin, Route, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import {
  assignIncidentPriorityAction,
  confirmIncidentAction,
  markDuplicateAction,
  rejectIncidentAction,
  requestClarificationAction,
  routeIncidentAction,
  validateIncidentAction,
} from "@/app/actions/validation";
import { FalseReportReview } from "@/components/validation/false-report-review";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { ValidationAiFinding, ValidationIncident, ValidationPriority } from "@/lib/validation.server";
import { formatDateTime } from "@/lib/utils";
import type { Severity, UserProfile } from "@/types";

type Decision = "validate" | "reject" | "duplicate" | "confirm" | "clarification" | "priority" | "route";

const priorities: ValidationPriority[] = ["critical", "high", "medium", "low"];
function titleCase(value: string | undefined, fallback = "Not Assigned") {
  if (!value) return fallback;
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string): Severity {
  if (status === "rejected") return "critical";
  if (status === "duplicate") return "neutral";
  if (["verified", "resolved", "closed"].includes(status)) return "success";
  return "warning";
}

function fieldClass() {
  return "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70";
}

function confidencePercent(value: number | undefined) {
  if (value === undefined) return undefined;
  return Math.round((value <= 1 ? value : value / 100) * 100);
}

function AiAssistance({ incident }: { incident: ValidationIncident }) {
  const analysis = incident.aiAnalysis;
  const status = analysis?.analysisStatus ?? "unavailable";
  const confidence = confidencePercent(analysis?.confidence);
  const statusLabel = status === "completed" ? "Analysis Completed" : status === "failed" ? "Analysis Failed" : "Analysis Unavailable";
  const statusTone: Severity = status === "completed" ? "information" : "warning";
  const findingsCount = analysis?.findingsCount ?? incident.images.reduce((total, image) => total + image.aiFindings.length, 0);

  return (
    <Card className="overflow-hidden border-brand-200">
      <CardHeader title="AI Assistance" description="Advisory screening from the server. It cannot change category, priority, routing, duplicate status, incident status, work orders, or closure." />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="warning" className="min-h-8 px-3 py-1">Manual Review Required</StatusBadge>
          <Badge tone={statusTone} className="min-h-8 px-3 py-1"><Sparkles className="size-3.5 shrink-0" aria-hidden="true" />{statusLabel}</Badge>
        </div>
        {status === "completed" ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-600">Advisory Hazard</dt><dd className="font-semibold text-slate-950">{analysis?.hazardType ? titleCase(analysis.hazardType) : "No Hazard Suggested"}</dd></div>
            <div><dt className="text-slate-600">Confidence</dt><dd className="font-semibold text-slate-950">{confidence !== undefined ? `${confidence}%` : "Not available"}</dd></div>
            <div><dt className="text-slate-600">Image Highlights</dt><dd className="font-semibold text-slate-950">{findingsCount}</dd></div>
            <div><dt className="text-slate-600">Category Model</dt><dd className="font-semibold text-slate-950">{analysis?.model ? titleCase(analysis.model) : "Available"}</dd></div>
          </dl>
        ) : (
          <div className="space-y-1 text-sm leading-6 text-slate-600">
            {analysis?.model ? <p>Assigned category model: <span className="font-semibold text-slate-800">{titleCase(analysis.model)}</span> (unavailable)</p> : null}
            <p>The report remains available for official validation. AI availability does not affect submission or the official decision workflow.</p>
          </div>
        )}
        {analysis?.processedAt ? <p className="text-xs text-slate-500">Processed {formatDateTime(analysis.processedAt)}</p> : null}
      </div>
    </Card>
  );
}

function Coordinates({ incident }: { incident: ValidationIncident }) {
  const [longitude, latitude] = incident.location.coordinates;
  const coordinateText = typeof longitude === "number" && typeof latitude === "number"
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : undefined;
  const mapsHref = coordinateText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateText)}`
    : undefined;
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Location Review" description="Citizen-confirmed pin; geographic jurisdiction is unverified. Human verification is required." />
      <div className="space-y-2 px-5 pt-5 text-sm">
        <p className="font-semibold">{incident.locationIntegrity?.comparison === "discrepancy" ? "Location Differs from Current GPS — Verification Required"
          : incident.locationIntegrity?.comparison === "consistent" ? "No Significant Discrepancy Detected"
            : incident.locationIntegrity?.comparison === "inconclusive" ? "Comparison Inconclusive" : "Comparison Unavailable"}</p>
        <p>Pin Source: {incident.locationIntegrity?.pinSource === "gps" ? "GPS" : titleCase(incident.locationIntegrity?.pinSource, "Not Recorded (Historical Report)")}</p>
        {incident.locationIntegrity?.distanceMeters !== undefined ? <p>Distance: {Math.round(incident.locationIntegrity.distanceMeters)} m; Reported GPS Accuracy: {incident.locationIntegrity.accuracyMeters} m</p> : null}
        {incident.locationIntegrity?.unavailableReason ? <p>Comparison Detail: {titleCase(incident.locationIntegrity.unavailableReason)}</p> : null}
        {incident.locationIntegrity?.explanation?.reason ? <p>Citizen Explanation: {titleCase(incident.locationIntegrity.explanation.reason)} {incident.locationIntegrity.explanation.text}</p> : null}
        <p>Pin Confirmation: {incident.locationIntegrity?.confirmedAt ? formatDateTime(incident.locationIntegrity.confirmedAt) : "Not Recorded (Historical Report)"}</p>
        <p>GPS is an untrusted advisory signal and does not establish photo capture location. Delayed and manual reporting are allowed.</p>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-950">{[incident.location.address.street, incident.location.address.barangay, incident.location.address.city].filter(Boolean).join(", ") || "Location details unavailable"}</p>
            {coordinateText ? <p className="mt-1 font-mono text-xs text-slate-600">{coordinateText}</p> : <p className="mt-1 text-sm text-amber-800">Coordinates were unavailable in this report.</p>}
            {mapsHref ? <a href={mapsHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">Open Reported Pin in Maps <ExternalLink className="size-3.5" aria-hidden="true" /></a> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Evidence({ incident }: { incident: ValidationIncident }) {
  const renderFinding = (finding: ValidationAiFinding, index: number) => {
    const confidence = confidencePercent(finding.confidence);
    return (
      <div
        key={`${finding.label}-${index}`}
        className="absolute border-2 border-amber-400 bg-amber-300/15"
        style={{
          left: `${finding.bbox.x1 * 100}%`,
          top: `${finding.bbox.y1 * 100}%`,
          width: `${(finding.bbox.x2 - finding.bbox.x1) * 100}%`,
          height: `${(finding.bbox.y2 - finding.bbox.y1) * 100}%`,
        }}
      >
        <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {titleCase(finding.label)}{confidence !== undefined ? ` · ${confidence}%` : ""}
        </span>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Evidence Review" description="Evidence URLs are supplied by the protected API; the processing status is shown below." />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {incident.images.length ? incident.images.map((image, index) => (
          <div key={`${image.url ?? "evidence"}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {image.url ? <a href={image.url} target="_blank" rel="noreferrer" className="block bg-slate-100" style={{ aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : "4 / 3" }}><div className="relative size-full"><img src={image.url} alt={`Submitted evidence ${index + 1}`} className="size-full object-contain" />{image.aiFindings.map(renderFinding)}</div></a> : <div className="flex aspect-[4/3] items-center justify-center text-slate-500"><FileImage className="size-8" aria-hidden="true" /></div>}
            <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-2.5 text-xs text-slate-600">
              {image.quality?.status ? <Badge tone={image.quality.status === "passed" ? "success" : "neutral"}>Quality: {titleCase(image.quality.status)}</Badge> : null}
              {image.privacyProcessing?.status === "applied" ? <Badge tone="success">Privacy Redaction: Applied</Badge> : null}
              {image.privacyProcessing?.status === "not_available" ? <Badge tone="warning">Privacy Redaction Unavailable</Badge> : null}
              {image.aiFindings.length ? <Badge tone="warning">AI highlights: {image.aiFindings.length}</Badge> : null}
            </div>
          </div>
        )) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">No evidence preview is currently available.</div>}
      </div>
      <div className="space-y-2 border-t border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-950">Description</h3>
        <p className="whitespace-pre-wrap break-words leading-7 text-slate-700">{incident.description}</p>
      </div>
    </Card>
  );
}

function Timeline({ incident }: { incident: ValidationIncident }) {
  const events = distinctTimelineEvents([...incident.history].reverse(), (entry) => ({
    timestamp: entry.changedAt,
    values: [timelineMilestoneLabel(entry.status) ?? entry.status, entry.notes?.trim() ?? ""],
  }));
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Status History" description="Events are recorded by the backend; this timeline is not fabricated by the interface." />
      <ol className="space-y-6 p-5">
        {events.length ? events.map((entry, index) => <li key={`${entry.status}-${entry.changedAt ?? index}`} className="flex gap-4"><TimelineMarker latest={index === 0} last={index === events.length - 1} /><div className="min-w-0 flex-1 break-words"><div className="flex flex-col gap-0.5"><p className="text-sm font-semibold leading-6 text-slate-900">{timelineEventLabel(entry.status)}</p>{entry.changedAt ? <time dateTime={entry.changedAt} className="text-xs leading-5 text-slate-500">{formatDateTime(entry.changedAt)}</time> : null}</div>{entry.notes ? <p className="mt-1 text-sm text-slate-600">{timelineNoteLabel(entry.notes)}</p> : null}</div></li>) : <li className="px-5 py-5 text-sm text-slate-600">No status events are available.</li>}
      </ol>
    </Card>
  );
}

function ValidationRoutingSummary({ incident }: { incident: ValidationIncident }) {
  const deadline = incident.sla?.deadline ? formatDateTime(incident.sla.deadline) : undefined;
  const targetHours = incident.sla?.targetResolutionTime;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Engineering and Provider Routing" description="Barangay review, City Engineering decisions, and provider assignment are recorded as separate handoffs." />
      <dl className="divide-y divide-slate-200 text-sm">
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Priority</dt><dd className="text-right font-semibold text-slate-900">{incident.priority ? titleCase(incident.priority) : "Not assigned by City Engineering"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Barangay</dt><dd className="text-right font-semibold text-slate-900">{incident.jurisdiction ?? incident.location.address.barangay ?? "To be confirmed"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Utility Provider</dt><dd className="text-right font-semibold text-slate-900">{incident.routing?.responsibleOrganization ?? "Not Assigned"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">SLA Deadline</dt><dd className="max-w-56 text-right font-semibold text-slate-900">{deadline ? <>{targetHours ? `${targetHours} hour target` : titleCase(incident.sla?.state)}<span className="mt-0.5 block text-xs font-normal text-slate-600">Due {deadline}</span></> : "Calculated after City Engineering assigns priority"}</dd></div>
      </dl>
    </Card>
  );
}

export function ValidationReview({ viewer, incident, utilityProviders = [] }: { viewer: UserProfile; incident: ValidationIncident; utilityProviders?: string[] }) {
  const router = useRouter();
  const isBarangay = viewer.backendRole === "barangay_official";
  const isCityEngineer = viewer.backendRole === "city_engineer";
  const initialDecision: Decision = isBarangay
    ? "validate"
    : incident.status === "barangay_validated" ? "confirm"
      : ["city_confirmed", "prioritized"].includes(incident.status) ? "priority"
        : "route";
  const [decision, setDecision] = useState<Decision>(initialDecision);
  const [priority, setPriority] = useState<ValidationPriority | "">(incident.priority ?? "");
  const barangay = incident.jurisdiction ?? incident.location.address.barangay ?? "";
  const [organization, setOrganization] = useState(() => {
    const current = incident.routing?.responsibleOrganization ?? "";
    return utilityProviders.includes(current) ? current : "";
  });
  const [routingReason, setRoutingReason] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [duplicateOf, setDuplicateOf] = useState(incident.duplicateCandidates[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const canBarangayReview = isBarangay && viewer.permissions.includes("reports.validate")
    && ["submitted", "clarification_required"].includes(incident.status);
  const canCityReview = isCityEngineer && viewer.permissions.includes("reports.validate")
    && ["barangay_validated", "city_confirmed", "prioritized"].includes(incident.status);

  const duplicateOptions = useMemo(() => incident.duplicateCandidates.map((candidate) => ({ value: candidate.id, label: `${candidate.reportNumber} · ${candidate.location?.address.barangay ?? "location unavailable"}` })), [incident.duplicateCandidates]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    if (!canBarangayReview && !canCityReview) return;
    if (["validate", "confirm"].includes(decision) && !barangay.trim()) {
      setError("This report is missing its validated barangay. Return it for clarification.");
      return;
    }
    if (["reject", "clarification"].includes(decision) && !reason.trim()) {
      setError("Provide a reason before continuing.");
      return;
    }
    if (decision === "duplicate" && (!duplicateOf || !reason.trim())) {
      setError("Select or enter a canonical report and provide a duplicate reason.");
      return;
    }
    if (decision === "priority" && !priority) {
      setError("Select the priority City Engineering has determined for this incident.");
      return;
    }
    if (["priority", "route"].includes(decision) && !organization) {
      setError("Select the responsible Utility Provider.");
      return;
    }
    setConfirm(true);
  };

  const confirmDecision = () => {
    startTransition(async () => {
      const result = decision === "validate"
        ? await validateIncidentAction({ incidentId: incident.id, jurisdiction: { barangay, city: incident.location.address.city }, notes })
        : decision === "reject"
          ? await rejectIncidentAction({ incidentId: incident.id, reason, notes })
          : decision === "duplicate"
            ? await markDuplicateAction({ incidentId: incident.id, duplicateOf, reason, notes })
            : decision === "confirm"
              ? await confirmIncidentAction({ incidentId: incident.id, jurisdiction: { barangay, city: incident.location.address.city }, notes })
              : decision === "clarification"
                ? await requestClarificationAction({ incidentId: incident.id, reason })
                : decision === "priority"
                  ? await (async () => {
                    if (incident.status === "city_confirmed" || priority !== incident.priority) {
                      const priorityResult = await assignIncidentPriorityAction({ incidentId: incident.id, priority: priority as ValidationPriority });
                      if (!priorityResult.ok) return priorityResult;
                    }
                    const routingResult = await routeIncidentAction({ incidentId: incident.id, organization, reason: routingReason });
                    if (!routingResult.ok) {
                      router.refresh();
                      return { ...routingResult, message: `Priority saved. ${routingResult.message}` };
                    }
                    return routingResult;
                  })()
                  : await routeIncidentAction({ incidentId: incident.id, organization, reason: routingReason });
      setConfirm(false);
      if (!result.ok) {
        setError(result.message);
        if (result.conflict) router.refresh();
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  };

  const decisionTitle = decision === "validate" ? "Validate at barangay level"
    : decision === "reject" ? "Reject Report"
      : decision === "duplicate" ? "Mark report as duplicate"
        : decision === "confirm" ? "Confirm at City Engineering"
          : decision === "clarification" ? "Return for Clarification"
            : decision === "priority" ? "Confirm Priority and Route"
              : "Route to Utility Provider";
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-sm font-semibold text-brand-700">{isBarangay ? `Barangay Review · ${viewer.organization}` : `City Engineering · ${viewer.organization}`}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{incident.reportNumber}</h1><p className="mt-2 max-w-3xl text-slate-600">Review citizen evidence and location before making the decision assigned to your role.</p></div>
        <StatusBadge tone={statusTone(incident.status)}>{titleCase(incident.status)}</StatusBadge>
      </div>

      {message ? <div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />{message}</div> : null}
      {error ? <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"><AlertTriangle className="size-5 shrink-0" aria-hidden="true" />{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Evidence incident={incident} />
          <AiAssistance incident={incident} />
          <Coordinates incident={incident} />
          {(isBarangay || isCityEngineer) ? <FalseReportReview incidentId={incident.id} status={incident.status} role={viewer.backendRole} /> : null}
          <ValidationRoutingSummary incident={incident} />
          <Timeline incident={incident} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden"><CardHeader title="Duplicate Candidates" description="Suggestions only; LUNAS never marks a report duplicate automatically." /><div className="divide-y divide-slate-200">{incident.duplicateCandidates.length ? incident.duplicateCandidates.map((candidate) => <div key={candidate.id} className="p-4"><p className="font-semibold text-slate-900">{candidate.reportNumber}</p><p className="mt-1 text-sm text-slate-600">{categoryLabel(candidate.category)} · {candidate.location?.address.barangay ?? "Location unavailable"}</p><div className="mt-2 flex gap-2">{candidate.distanceMeters !== undefined ? <Badge>{Math.round(candidate.distanceMeters)} m away</Badge> : null}{candidate.score !== undefined ? <Badge tone="warning">Candidate score {Math.round(candidate.score)}</Badge> : null}</div></div>) : <p className="p-4 text-sm text-slate-600">No likely duplicate reports found.</p>}</div></Card>

          <Card className="overflow-hidden"><CardHeader title={isBarangay ? "Barangay Validation" : "City Engineering Decision"} description="Each handoff is recorded by the backend with the actor, state, timestamp, and decision notes." />
            {canBarangayReview ? <form onSubmit={submit} className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-2">{(["validate", "reject", "duplicate"] as Decision[]).map((value) => <button key={value} type="button" onClick={() => { setDecision(value); setError(undefined); }} className={`min-h-10 rounded-lg border px-2 text-xs font-bold ${decision === value ? value === "reject" ? "border-red-700 bg-red-700 text-white" : value === "duplicate" ? "border-slate-700 bg-slate-700 text-white" : "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{value === "validate" ? "Validate" : value === "reject" ? "Reject" : "Duplicate"}</button>)}</div>
              {decision === "reject" ? <label className="block text-sm font-semibold text-slate-800">Rejection Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} maxLength={500} required /></label> : null}
              {decision === "duplicate" ? <><label className="block text-sm font-semibold text-slate-800">Canonical Report<select value={duplicateOf} onChange={(event) => setDuplicateOf(event.target.value)} className={fieldClass()} required><option value="">Select a Likely Match</option>{duplicateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Duplicate Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} maxLength={500} required /></label></> : null}
              <label className="block text-sm font-semibold text-slate-800">Review Note <span className="font-normal text-slate-500">(Optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={2000} /></label>
              <Button type="submit" variant={decision === "reject" ? "danger" : "primary"} className="w-full" disabled={pending}>{decision === "validate" ? <><ShieldCheck className="size-4" /> Validate and Forward</> : decision === "reject" ? <><XCircle className="size-4" /> Reject Report</> : <><Route className="size-4" /> Mark Duplicate</>}</Button>
            </form> : null}
            {canCityReview && incident.status === "barangay_validated" ? <form onSubmit={submit} className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2">{(["confirm", "clarification"] as Decision[]).map((value) => <button key={value} type="button" onClick={() => { setDecision(value); setError(undefined); }} className={`min-h-10 rounded-lg border px-2 text-xs font-bold ${decision === value ? value === "clarification" ? "border-amber-700 bg-amber-700 text-white" : "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{value === "confirm" ? "Confirm" : "Return for Clarification"}</button>)}</div>
              {decision === "confirm" ? <><label className="block text-sm font-semibold text-slate-800">Engineering Review Note <span className="font-normal text-slate-500">(Optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={2000} /></label></> : <label className="block text-sm font-semibold text-slate-800">Clarification Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} maxLength={2000} required /></label>}
              <Button type="submit" variant={decision === "clarification" ? "secondary" : "primary"} className="w-full" disabled={pending}>{decision === "confirm" ? "Confirm for Engineering" : "Return with reason"}</Button>
            </form> : null}
            {canCityReview && ["city_confirmed", "prioritized"].includes(incident.status) ? <form onSubmit={submit} className="space-y-4 p-5">
              <label className="block text-sm font-semibold text-slate-800">Priority and SLA<select value={priority} onChange={(event) => setPriority(event.target.value as ValidationPriority | "")} className={fieldClass()} required><option value="">Select Priority</option>{priorities.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select><span className="mt-2 block text-xs font-normal leading-5 text-slate-500">The SLA timer starts when the report is assigned to the selected Utility Provider.</span></label>
              <label className="block text-sm font-semibold text-slate-800">Responsible Utility Provider<select value={organization} onChange={(event) => setOrganization(event.target.value)} className={fieldClass()} required><option value="">Select an Active Provider Organization</option>{utilityProviders.map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select></label>{utilityProviders.length ? <p className="text-xs leading-5 text-slate-500">Only organizations with active, provisioned Utility Provider accounts are selectable.</p> : <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">No active Utility Provider organization is provisioned. An Admin must authorize and provision one before City Engineering can route this incident.</p>}<label className="block text-sm font-semibold text-slate-800">Routing Note <span className="font-normal text-slate-500">(Optional)</span><textarea value={routingReason} onChange={(event) => setRoutingReason(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={1000} /></label><Button type="submit" className="w-full" disabled={pending || !organization || utilityProviders.length === 0 || !priority}><Route className="size-4" /> Confirm Priority and Route</Button></form> : null}
            {!canBarangayReview && !(canCityReview && ["barangay_validated", "city_confirmed", "prioritized"].includes(incident.status)) ? <div className="p-5 text-sm text-slate-600">No decision controls are available for this role or incident state.</div> : null}
          </Card>
          {incident.workOrder?.id ? <Card className="overflow-hidden"><CardHeader title="Work Order" description="This incident already has its primary maintenance work order." /><div className="p-5"><p className="font-semibold text-slate-950">{incident.workOrder.reference ?? "Work order created"}</p><p className="mt-1 text-sm text-slate-600">{incident.workOrder.status?.replaceAll("_", " ") ?? "Operational status available"}</p><Link href={`/work-orders/${encodeURIComponent(incident.workOrder.id)}`} className="mt-4 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Open Work Order <Route className="ml-1 size-4" /></Link></div></Card> : null}
        </aside>
      </div>

      <ConfirmationDialog open={confirm} onClose={() => !pending && setConfirm(false)} onConfirm={confirmDecision} loading={pending} icon="none" destructive={decision === "reject" || decision === "clarification"} title={decisionTitle} description={decision === "validate" ? "This records Barangay validation and forwards the report to City Engineering. Priority and provider assignment remain separate decisions." : decision === "reject" ? "This rejects the report with the reason entered above." : decision === "duplicate" ? "This records a human duplicate decision. Candidate matching alone does not change the report." : decision === "confirm" ? "This records City Engineering confirmation. Priority and SLA are assigned in the next step." : decision === "clarification" ? "This returns the report for clarification and records your reason." : decision === "priority" ? "This records the selected priority, assigns the report to the selected Utility Provider, and starts the SLA timer." : "This assigns the incident to the named Utility Provider organization."} confirmLabel={decisionTitle} />
    </div>
  );
}
