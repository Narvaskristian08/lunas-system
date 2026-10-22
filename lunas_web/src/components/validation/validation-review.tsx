"use client";

import { AgencyScheduleCard } from "@/components/validation/agency-schedule-card";
import { categoryLabel } from "@/lib/category-label";

/* Signed private evidence URLs are dynamic and intentionally not passed to Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TimelineMarker } from "@/components/ui/timeline-marker";
import { distinctTimelineEvents, timelineEventLabel, timelineMilestoneLabel, timelineNoteLabel } from "@/lib/timeline-display";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ExternalLink, FileImage, MapPin, Route, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import {
  markDuplicateAction,
  rejectIncidentAction,
  routeIncidentAction,
  validateIncidentAction,
} from "@/app/actions/validation";
import { assignCompletionTanodAction, assignTanodAction, completeIncidentAction, requestAgencyCorrectionAction, reviewTanodAction } from "@/app/actions/tanod-workflow";
import { FalseReportReview } from "@/components/validation/false-report-review";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { ValidationAiFinding, ValidationIncident } from "@/lib/validation.server";
import { formatDateTime } from "@/lib/utils";
import type { Severity, UserProfile } from "@/types";

type Decision = "validate" | "reject" | "duplicate" | "priority" | "route";

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

function workflowStep(incident: ValidationIncident) {
  if (incident.status === "closed" || incident.status === "resolved") return 5;
  if (incident.completionInspection?.status || incident.status === "agency_completed") return 4;
  if (["tanod_verified", "provider_assigned", "prioritized", "barangay_validated"].includes(incident.status)) return 3;
  if (["tanod_assigned", "tanod_in_progress", "tanod_rejected", "clarification_required"].includes(incident.status)) return 2;
  return 1;
}

function WorkflowProgress({ incident }: { incident: ValidationIncident }) {
  const stages = ["Submitted", "Barangay review", "Agency work", "Final check", "Completed"];
  const step = workflowStep(incident);
  return <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4" aria-label={`Report progress: ${stages[step - 1]}, step ${step} of ${stages.length}`}><div className="flex items-center justify-between text-xs font-semibold text-slate-600"><span>Report progress</span><span>Step {step} of {stages.length}</span></div><div className="mt-3 flex gap-1" aria-hidden="true">{stages.map((stage, index) => <div key={stage} className={`h-2 flex-1 rounded-full ${index < step ? "bg-brand-600" : "bg-slate-200"}`} />)}</div><p className="mt-2 text-sm font-semibold text-brand-700">{stages[step - 1]}</p><div className="mt-1 grid grid-cols-5 gap-1 text-[10px] leading-4 text-slate-500">{stages.map((stage) => <span key={stage}>{stage}</span>)}</div></div>;
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
  const manualReviewCandidate = status === "completed" && analysis?.classificationStatus === "manual_review";
  const manualReviewOnly = analysis?.manualReviewOnly === true || incident.category.toLowerCase() === "other";

  return (
    <Card className="overflow-hidden border-brand-200">
      <CardHeader title="AI Assistance" description="Advisory screening from the server. It cannot change category, priority, routing, duplicate status, incident status, work orders, or closure." />
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="warning" className="min-h-8 px-3 py-1">Manual Review Required</StatusBadge>
          <Badge tone={statusTone} className="min-h-8 px-3 py-1"><Sparkles className="size-3.5 shrink-0" aria-hidden="true" />{statusLabel}</Badge>
          {manualReviewOnly ? <Badge tone="warning" className="min-h-8 px-3 py-1">Manual review only</Badge> : manualReviewCandidate ? <Badge tone="warning" className="min-h-8 px-3 py-1">Low-confidence candidate</Badge> : null}
        </div>
        {status === "completed" ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-600">Advisory Hazard</dt><dd className="font-semibold text-slate-950">{manualReviewOnly ? "No automatic hazard classification" : analysis?.hazardType ? titleCase(analysis.hazardType) : manualReviewCandidate ? "No production hazard suggested" : "No Hazard Suggested"}</dd></div>
            <div><dt className="text-slate-600">Confidence</dt><dd className="font-semibold text-slate-950">{confidence !== undefined ? `${confidence}%` : "Not available"}</dd></div>
            <div><dt className="text-slate-600">Image Highlights</dt><dd className="font-semibold text-slate-950">{findingsCount}</dd></div>
            <div><dt className="text-slate-600">Category Model</dt><dd className="font-semibold text-slate-950">{analysis?.model ? titleCase(analysis.model) : "Available"}</dd></div>
            {manualReviewOnly ? <div className="sm:col-span-2"><dt className="text-slate-600">Reviewer guidance</dt><dd className="font-normal leading-6 text-amber-900">Other-category AI output is advisory only. Review the original image and choose the correct issue manually; candidate labels are not confirmed hazards.</dd></div> : manualReviewCandidate ? <div className="sm:col-span-2"><dt className="text-slate-600">Reviewer guidance</dt><dd className="font-normal leading-6 text-amber-900">The model found a weak candidate. Review the image manually; do not treat the candidate label as a confirmed hazard.</dd></div> : null}
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
  const [expanded, setExpanded] = useState(false);
  const events = distinctTimelineEvents([...incident.history].reverse(), (entry) => ({
    timestamp: entry.changedAt,
    values: [timelineMilestoneLabel(entry.status) ?? entry.status, entry.notes?.trim() ?? ""],
  }));
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Status History" />
      {events.length ? <>
        <div className="border-b border-slate-200 p-5">
          <TimelineEntry entry={events[0]} latest last={!expanded && events.length === 1} />
          {events.length > 1 ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"><span aria-hidden="true">{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</span>{expanded ? "Hide previous updates" : `Show ${events.length - 1} previous update${events.length - 1 === 1 ? "" : "s"}`}</button> : null}
        </div>
        {expanded ? <ol className="space-y-6 p-5 pt-0">{events.slice(1).map((entry, index) => <TimelineEntry key={`${entry.status}-${entry.changedAt ?? index}`} entry={entry} last={index === events.length - 2} />)}</ol> : null}
      </> : <p className="p-5 text-sm text-slate-600">No status events are available.</p>}
    </Card>
  );
}

function TimelineEntry({ entry, latest = false, last = false }: { entry: ValidationIncident["history"][number]; latest?: boolean; last?: boolean }) {
  return <li className="flex gap-4"><TimelineMarker latest={latest} last={last} /><div className="min-w-0 flex-1 break-words"><div className="flex flex-col gap-0.5"><p className="text-sm font-semibold leading-6 text-slate-900">{timelineEventLabel(entry.status)}</p>{entry.changedAt ? <time dateTime={entry.changedAt} className="text-xs leading-5 text-slate-500">{formatDateTime(entry.changedAt)}</time> : null}</div>{entry.notes ? <p className="mt-1 text-sm text-slate-600">{timelineNoteLabel(entry.notes)}</p> : null}</div></li>;
}

function ValidationRoutingSummary({ incident }: { incident: ValidationIncident }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Agency Routing" description="The approved category selects the agency automatically. The agency sets priority and SLA after receiving the report." />
      <dl className="divide-y divide-slate-200 text-sm">
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Barangay</dt><dd className="text-right font-semibold text-slate-900">{incident.jurisdiction ?? incident.location.address.barangay ?? "To be confirmed"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Utility Provider</dt><dd className="text-right font-semibold text-slate-900">{incident.routing?.responsibleOrganization ?? "Not Assigned"}</dd></div>
      </dl>
    </Card>
  );
}

export function ValidationReview({ viewer, incident, utilityProviders = [], tanods = [] }: { viewer: UserProfile; incident: ValidationIncident; utilityProviders?: string[]; tanods?: Array<{ id: string; firstName?: string; lastName?: string; barangay?: string }> }) {
  const router = useRouter();
  const isBarangay = viewer.backendRole === "barangay_official";
  const initialDecision: Decision = ["submitted", "clarification_required"].includes(incident.status)
    ? "validate" : "route";
  const [decision, setDecision] = useState<Decision>(initialDecision);
  const barangay = incident.jurisdiction ?? incident.location.address.barangay ?? "";
  const [organization, setOrganization] = useState(() => {
    const current = incident.routing?.responsibleOrganization ?? "";
    return utilityProviders.includes(current) ? current : "";
  });
  const [manualAgencyCorrection, setManualAgencyCorrection] = useState(false);
  const [routingReason, setRoutingReason] = useState("");
  const [tanodId, setTanodId] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [completionTanodId, setCompletionTanodId] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [duplicateOf, setDuplicateOf] = useState(incident.duplicateCandidates[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const [confirmTanod, setConfirmTanod] = useState(false);
  const [confirmCompletionTanod, setConfirmCompletionTanod] = useState(false);
  const [confirmFinalization, setConfirmFinalization] = useState(false);
  const [confirmCorrection, setConfirmCorrection] = useState(false);
  const [completionSuccessOpen, setCompletionSuccessOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const canBarangayReview = isBarangay && viewer.permissions.includes("reports.validate")
    && !["submitted", "clarification_required", "tanod_assigned", "tanod_in_progress", "tanod_verified", "provider_assigned", "closed"].includes(incident.status)
    && !incident.initialInspection?.id;
  const canRoute = isBarangay && viewer.permissions.includes("reports.validate")
    && ["tanod_verified", "provider_assigned"].includes(incident.status) && incident.initialInspection?.status === "approved" && !incident.priority;
  const canAssignTanod = isBarangay && viewer.permissions.includes("reports.validate")
    && ["submitted", "clarification_required", "tanod_rejected"].includes(incident.status);
  const canReviewTanod = isBarangay && viewer.permissions.includes("reports.validate")
    && incident.status === "tanod_verified" && incident.initialInspection?.status === "submitted";
  const canAssignCompletion = isBarangay && viewer.permissions.includes("reports.validate")
    && incident.agencyStatus === "work_completed" && !incident.completionInspection?.id;
  const canComplete = isBarangay && viewer.permissions.includes("reports.validate")
    && incident.completionInspection?.status === "submitted" && incident.completionInspection.result === "verified"
    && incident.agencyStatus === "work_completed";
  const canRequestCorrection = isBarangay && viewer.permissions.includes("reports.validate")
    && incident.completionInspection?.status === "submitted"
    && incident.agencyStatus === "work_completed";
  const correctionAlreadySent = incident.agencyStatus === "correction_required";

  const duplicateOptions = useMemo(() => incident.duplicateCandidates.map((candidate) => ({ value: candidate.id, label: `${candidate.reportNumber} · ${candidate.location?.address.barangay ?? "location unavailable"}` })), [incident.duplicateCandidates]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    if (!canBarangayReview && !canRoute) return;
    if (["validate", "confirm"].includes(decision) && !barangay.trim()) {
      setError("This report is missing its validated barangay. Return it for clarification.");
      return;
    }
    if (["reject", "clarification"].includes(decision) && reason.trim().length < 2) {
      setError("Enter a reason of at least 2 characters.");
      return;
    }
    if (decision === "duplicate" && (!duplicateOf || reason.trim().length < 2)) {
      setError("Select or enter a canonical report and provide a duplicate reason of at least 2 characters.");
      return;
    }
    if (["priority", "route"].includes(decision) && manualAgencyCorrection && !organization) {
      setError("Choose an agency only if the category or automatic agency assignment is wrong.");
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
            : await routeIncidentAction({ incidentId: incident.id, organization, reason: routingReason });
      setConfirm(false);
      if (!result.ok) {
        setError(result.message);
        if (result.conflict) router.refresh();
        return;
      }
      setMessage(result.message);
      if (decision === "validate") setDecision("route");
      router.refresh();
    });
  };

  const assignTanod = () => {
    if (!tanodId) return;
    startTransition(async () => {
      const result = await assignTanodAction(incident.id, tanodId);
      setConfirmTanod(false);
      if (result.ok) router.refresh(); else setError(result.message);
    });
  };

  const reviewTanod = (decisionValue: "approve" | "reject" | "clarification") => {
    if (!incident.initialInspection?.id) return;
    startTransition(async () => {
      const result = await reviewTanodAction(incident.id, incident.initialInspection!.id!, decisionValue, inspectionNotes);
      if (result.ok) router.refresh(); else setError(result.message);
    });
  };

  const assignCompletion = () => {
    if (!completionTanodId) return;
    startTransition(async () => {
      const result = await assignCompletionTanodAction(incident.id, completionTanodId);
      setConfirmCompletionTanod(false);
      if (result.ok) router.refresh(); else setError(result.message);
    });
  };

  const completeIncident = () => {
    if (!incident.completionInspection?.id) return;
    startTransition(async () => {
      const result = await completeIncidentAction(incident.id, incident.completionInspection!.id!, completionNotes);
      setConfirmFinalization(false);
      if (result.ok) {
        setMessage(result.message || "Incident finalized and completed.");
        setCompletionSuccessOpen(true);
        router.refresh();
      } else setError(result.message);
    });
  };

  const requestCorrection = () => {
    if (!correctionReason.trim()) { setError("Enter a correction reason."); return; }
    startTransition(async () => {
      const result = await requestAgencyCorrectionAction(incident.id, correctionReason);
      setConfirmCorrection(false);
      if (result.ok) { setMessage(result.message || "Correction request sent to the agency."); setCorrectionReason(""); router.refresh(); } else setError(result.message);
    });
  };

  const decisionTitle = decision === "validate" ? "Validate at barangay level"
    : decision === "reject" ? "Reject Report"
      : decision === "duplicate" ? "Mark report as duplicate"
        : decision === "priority" ? "Apply Agency Correction"
              : "Apply Agency Correction";
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-sm font-semibold text-brand-700">{isBarangay ? `Barangay Review · ${viewer.organization}` : `City Engineering · ${viewer.organization}`}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{incident.reportNumber}</h1><p className="mt-2 max-w-3xl text-slate-600">Review citizen evidence and location before making the decision assigned to your role.</p></div>
        <StatusBadge tone={statusTone(incident.status)}>{titleCase(incident.status)}</StatusBadge>
      </div>
      <WorkflowProgress incident={incident} />
      {isBarangay ? <AgencyScheduleCard schedule={incident.agencySchedule} /> : null}

      {message ? <div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />{message}</div> : null}
      {error ? <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"><AlertTriangle className="size-5 shrink-0" aria-hidden="true" />{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Evidence incident={incident} />
          <AiAssistance incident={incident} />
          <Coordinates incident={incident} />
          {isBarangay ? <FalseReportReview incidentId={incident.id} status={incident.status} role={viewer.backendRole} /> : null}
          <ValidationRoutingSummary incident={incident} />
          <Timeline incident={incident} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden"><CardHeader title="Duplicate Candidates" description="Suggestions only; LUNAS never marks a report duplicate automatically." /><div className="divide-y divide-slate-200">{incident.duplicateCandidates.length ? incident.duplicateCandidates.map((candidate) => <div key={candidate.id} className="p-4"><p className="font-semibold text-slate-900">{candidate.reportNumber}</p><p className="mt-1 text-sm text-slate-600">{categoryLabel(candidate.category)} · {candidate.location?.address.barangay ?? "Location unavailable"}</p><div className="mt-2 flex gap-2">{candidate.distanceMeters !== undefined ? <Badge>{Math.round(candidate.distanceMeters)} m away</Badge> : null}{candidate.score !== undefined ? <Badge tone="warning">Candidate score {Math.round(candidate.score)}</Badge> : null}</div></div>) : <p className="p-4 text-sm text-slate-600">No likely duplicate reports found.</p>}</div></Card>

          <Card className="overflow-hidden"><CardHeader title={isBarangay ? "Barangay Validation" : "Provider Routing"} />
            {canAssignTanod ? <div className="space-y-4 border-b border-slate-200 p-5"><div><p className="font-semibold text-slate-900">Assign Barangay Tanod</p><p className="mt-1 text-sm leading-6 text-slate-600">A Tanod must inspect the location before the report can be routed to an agency.</p></div><select value={tanodId} onChange={(event) => setTanodId(event.target.value)} className={fieldClass()}><option value="">Select Utility Personnel</option>{tanods.map((tanod) => <option key={tanod.id} value={tanod.id}>{[tanod.firstName, tanod.lastName].filter(Boolean).join(" ") || "Utility Personnel"}</option>)}</select><Button type="button" className="w-full" disabled={pending || !tanodId} onClick={() => setConfirmTanod(true)}>Assign Tanod for Inspection</Button></div> : null}
            {canReviewTanod ? <div className="space-y-4 border-b border-slate-200 p-5"><div><p className="font-semibold text-slate-900">Tanod Verification</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{incident.initialInspection?.findings || "No findings were submitted."}</p><p className="mt-2 text-xs text-slate-500">Result: {titleCase(incident.initialInspection?.result)}</p>{incident.initialInspection?.evidence?.length ? <div className="mt-3 grid grid-cols-2 gap-2">{incident.initialInspection.evidence.map((photo, index) => photo.url ? <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt={`Tanod verification ${index + 1}`} className="aspect-square w-full rounded-lg border object-cover" /></a> : null)}</div> : <p className="mt-2 text-xs text-amber-700">No Tanod verification photo is available.</p>}</div><textarea value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} placeholder="Review note (required for rejection or clarification)" /><div className="grid gap-2 sm:grid-cols-2"><Button type="button" disabled={pending} onClick={() => reviewTanod("approve")}>Approve Verification</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => reviewTanod("clarification")}>Request Clarification</Button></div><Button type="button" variant="danger" className="w-full" disabled={pending} onClick={() => reviewTanod("reject")}>Reject Verification</Button><p className="text-xs leading-5 text-slate-500">Approval automatically sends this report to the agency assigned to the category. Priority and SLA are set by that agency.</p></div> : null}
            {canAssignCompletion ? <div className="space-y-4 border-b border-slate-200 p-5"><div><p className="font-semibold text-slate-900">Agency Reported Work Completed</p><p className="mt-1 text-sm leading-6 text-slate-600">Assign a Tanod from {barangay || "this barangay"} for final completion verification.</p></div><p className="text-xs text-slate-600">Agency update: {incident.agencyStatusNote || "No additional agency note."}</p><select value={completionTanodId} onChange={(event) => setCompletionTanodId(event.target.value)} className={fieldClass()}><option value="">Select Utility Personnel</option>{tanods.map((tanod) => <option key={tanod.id} value={tanod.id}>{[tanod.firstName, tanod.lastName].filter(Boolean).join(" ") || "Utility Personnel"}</option>)}</select><Button type="button" className="w-full" disabled={pending || !completionTanodId} onClick={() => setConfirmCompletionTanod(true)}>Assign Tanod for Final Verification</Button></div> : null}
            {incident.completionInspection?.status === "submitted" ? <div className="space-y-4 border-b border-slate-200 p-5"><div><p className="font-semibold text-slate-900">Final Tanod Verification</p><p className="mt-1 text-sm font-medium text-slate-700">Choose one final decision:</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">{incident.completionInspection.findings || "No findings were submitted."}</p><p className="mt-2 text-xs text-slate-500">Result: {titleCase(incident.completionInspection.result)}</p>{incident.completionInspection.evidence?.length ? <div className="mt-3 grid grid-cols-2 gap-2">{incident.completionInspection.evidence.map((photo, index) => photo.url ? <a key={`${photo.url}-${index}`} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt={`Final verification ${index + 1}`} className="aspect-square w-full rounded-lg border object-cover" /></a> : null)}</div> : <p className="mt-2 text-xs text-amber-700">No final verification photos are available.</p>}</div>{correctionAlreadySent ? <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Correction request has been sent</p><p className="mt-1">The agency must update the work before another final verification can be assigned.</p>{incident.agencyStatusNote ? <p className="mt-2 whitespace-pre-wrap">Reason: {incident.agencyStatusNote}</p> : null}</div> : null}{canRequestCorrection ? <Button type="button" variant="danger" className="w-full" disabled={pending} onClick={() => setConfirmCorrection(true)}>Request Correction</Button> : null}{canComplete ? <><textarea value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} placeholder="Final completion note (optional)" /><Button type="button" className="w-full" disabled={pending} onClick={() => setConfirmFinalization(true)}>Finalize and Complete</Button></> : null}</div> : null}
            {canBarangayReview ? <form onSubmit={submit} className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-2">{(["validate", "reject", "duplicate"] as Decision[]).map((value) => <button key={value} type="button" onClick={() => { setDecision(value); setError(undefined); }} className={`min-h-10 rounded-lg border px-2 text-xs font-bold ${decision === value ? value === "reject" ? "border-red-700 bg-red-700 text-white" : value === "duplicate" ? "border-slate-700 bg-slate-700 text-white" : "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{value === "validate" ? "Validate" : value === "reject" ? "Reject" : "Duplicate"}</button>)}</div>
              {decision === "reject" ? <label className="block text-sm font-semibold text-slate-800">Rejection Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} minLength={2} maxLength={500} required /></label> : null}
              {decision === "duplicate" ? <><label className="block text-sm font-semibold text-slate-800">Canonical Report<select value={duplicateOf} onChange={(event) => setDuplicateOf(event.target.value)} className={fieldClass()} required><option value="">Select a Likely Match</option>{duplicateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Duplicate Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} minLength={2} maxLength={500} required /></label></> : null}
              <label className="block text-sm font-semibold text-slate-800">Review Note <span className="font-normal text-slate-500">(Optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={2000} /></label>
              <Button type="submit" variant={decision === "reject" ? "danger" : "primary"} className="w-full" disabled={pending}>{decision === "validate" ? <><ShieldCheck className="size-4" /> Validate and Forward</> : decision === "reject" ? <><XCircle className="size-4" /> Reject Report</> : <><Route className="size-4" /> Mark Duplicate</>}</Button>
            </form> : null}
            {canRoute ? <form onSubmit={submit} className="space-y-4 p-5"><p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">The approved category chooses the agency automatically. Priority and SLA are set by the agency after it receives the report.</p>
              <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Automatic agency</p><p className="mt-1 text-sm font-semibold text-slate-900">{incident.routing?.responsibleOrganization ?? "Selected automatically after approval"}</p></div>
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={manualAgencyCorrection} onChange={(event) => { setManualAgencyCorrection(event.target.checked); if (!event.target.checked) setOrganization(incident.routing?.responsibleOrganization ?? ""); }} className="mt-1 size-4 rounded border-slate-300 text-brand-700" /> <span>Confirm or correct responsible agency after verifying ownership and jurisdiction</span></label>
              {manualAgencyCorrection ? <><label className="block text-sm font-semibold text-slate-800">Replacement agency<select value={organization} onChange={(event) => setOrganization(event.target.value)} className={fieldClass()} required><option value="">Select an agency</option>{utilityProviders.map((provider) => <option key={provider} value={provider}>{provider}</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Reason <span className="font-normal text-slate-500">(Required)</span><textarea value={routingReason} onChange={(event) => setRoutingReason(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={1000} required /></label><Button type="submit" className="w-full" disabled={pending || !organization}><Route className="size-4" /> Apply Manual Agency Correction</Button></> : <p className="text-xs leading-5 text-slate-500">No action is needed when the automatic agency is correct.</p>}</form> : null}
            {!canBarangayReview && !(canRoute && (["barangay_validated", "city_confirmed", "prioritized"].includes(incident.status) || incident.status === "tanod_verified")) && !canAssignCompletion && !canComplete && incident.completionInspection?.status !== "submitted" ? <div className="p-5 text-sm text-slate-600">No decision controls are available for this role or incident state.</div> : null}
          </Card>
          {incident.workOrder?.id ? <Card className="overflow-hidden"><CardHeader title="Work Order" description="This incident already has its primary maintenance work order." /><div className="p-5"><p className="font-semibold text-slate-950">{incident.workOrder.reference ?? "Work order created"}</p><p className="mt-1 text-sm text-slate-600">{incident.workOrder.status?.replaceAll("_", " ") ?? "Operational status available"}</p><Link href={`/work-orders/${encodeURIComponent(incident.workOrder.id)}`} className="mt-4 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Open Work Order <Route className="ml-1 size-4" /></Link></div></Card> : null}
        </aside>
      </div>

      <ConfirmationDialog open={confirm} onClose={() => !pending && setConfirm(false)} onConfirm={confirmDecision} loading={pending} icon="none" destructive={decision === "reject"} title={decisionTitle} description={decision === "validate" ? "This records the Barangay review. The report will then be routed automatically by category." : decision === "reject" ? "This rejects the report with the reason entered above." : decision === "duplicate" ? "This records a human duplicate decision. Candidate matching alone does not change the report." : "This applies the selected agency correction. Priority and SLA remain with the agency."} confirmLabel={decisionTitle} />
      <ConfirmationDialog open={confirmTanod} onClose={() => !pending && setConfirmTanod(false)} onConfirm={assignTanod} loading={pending} icon="none" title="Assign Barangay Tanod" description={`Assign ${tanods.find((tanod) => tanod.id === tanodId)?.firstName ?? "the selected Tanod"} to inspect report ${incident.reportNumber}?`} confirmLabel="Confirm Assignment" />
      <ConfirmationDialog open={confirmCompletionTanod} onClose={() => !pending && setConfirmCompletionTanod(false)} onConfirm={assignCompletion} loading={pending} icon="none" title="Assign Final Tanod Verification" description={`Assign ${tanods.find((tanod) => tanod.id === completionTanodId)?.firstName ?? "the selected Tanod"} to verify the completed work for report ${incident.reportNumber}?`} confirmLabel="Confirm Assignment" />
      <ConfirmationDialog open={confirmCorrection} onClose={() => !pending && setConfirmCorrection(false)} onConfirm={requestCorrection} loading={pending} icon="none" destructive title="Request Agency Correction" description="Explain what the agency needs to correct, then submit the request." confirmLabel="Submit Correction Request"><textarea autoFocus value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className={`${fieldClass()} min-h-28 max-h-40 resize-none overflow-y-auto py-2`} placeholder="Correction reason" maxLength={2000} /></ConfirmationDialog>
      <ConfirmationDialog open={confirmFinalization} onClose={() => !pending && setConfirmFinalization(false)} onConfirm={completeIncident} loading={pending} icon="none" title="Finalize and Complete" description={`Finalize the verified work and close report ${incident.reportNumber}? This will notify the citizen.`} confirmLabel="Confirm and Complete" />
      {completionSuccessOpen ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="completion-success-title"><div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-2xl"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-8" aria-hidden="true" /></div><h2 id="completion-success-title" className="mt-4 text-xl font-bold text-slate-950">Incident completed</h2><p className="mt-2 text-sm leading-6 text-slate-600">The final Tanod verification was approved and the citizen has been notified.</p><Button type="button" className="mt-6 w-full" onClick={() => setCompletionSuccessOpen(false)}>Done</Button></div></div> : null}
    </div>
  );
}
