"use client";

import { categoryLabel } from "@/lib/category-label";

import { distinctTimelineEvents, timelineEventLabel, timelineNoteLabel } from "@/lib/timeline-display";

/* Signed evidence URLs are supplied by the protected API and should not be optimized by Next image. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { TimelineMarker } from "@/components/ui/timeline-marker";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileImage,
  MapPin,
  ClipboardCheck,
  Play,
  Route,
  UserRoundCheck,
  UsersRound,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  acceptWorkOrderAction,
  assignWorkOrderAction,
  completeRepairWorkAction,
  coordinateCityCorrectionAction,
  declineWorkOrderAction,
  finalReviewWorkOrderAction,
  reassignWorkOrderAction,
  reviewCompletedWorkAction,
  startWorkOrderAction,
  updateRepairProgressAction,
  type WorkOrderActionResult,
} from "@/app/actions/work-orders";
import { Breadcrumbs, PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/providers/toast-provider";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { UserProfile } from "@/types";
import type { EligibleRepairPersonnel, WorkOrder } from "@/lib/work-orders.server";
import { cn, formatDateTime } from "@/lib/utils";
import {
  assignmentLabel,
  assignmentTone,
  formatLocation,
  formatPerson,
  formatRemaining,
  priorityTone,
  SlaBadges,
  titleCase,
  workOrderStatusTone,
  workOrderStatusLabel,
} from "@/components/work-orders/work-order-ui";

function alertClass(kind: "success" | "error") {
  return kind === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : "border-red-200 bg-red-50 text-red-950";
}

function ActionNotice({ message, kind }: { message?: string; kind?: "success" | "error" }) {
  if (!message || !kind) return null;
  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle;
  return <div role={kind === "error" ? "alert" : "status"} className={cn("mb-5 flex gap-3 rounded-xl border p-4 text-sm", alertClass(kind))}><Icon className="size-5 shrink-0" aria-hidden="true" />{message}</div>;
}

function personName(person: EligibleRepairPersonnel) {
  const name = formatPerson(person.firstName, person.lastName, "Eligible repair personnel");
  return person.repairAccountType === "team" ? `${person.team || "Team"} · ${name} (Team)` : `${name} (Individual)`;
}

function AssignmentPanel({
  workOrder,
  eligiblePersonnel,
  onResult,
}: {
  workOrder: WorkOrder;
  eligiblePersonnel: EligibleRepairPersonnel[];
  onResult: (result: WorkOrderActionResult) => void;
}) {
  const [assigneeId, setAssigneeId] = useState("");
  const [reason, setReason] = useState("");
  const [assignmentInstructions, setAssignmentInstructions] = useState(workOrder.instructions ?? "");
  const [confirmReassignment, setConfirmReassignment] = useState(false);
  const [pending, startTransition] = useTransition();
  const hasAssignment = Boolean(workOrder.currentAssignment || workOrder.assignee);
  const isDeclinedHandoff = workOrder.status === "in_progress" && workOrder.assignmentState === "declined";
  const isReassignment = hasAssignment || isDeclinedHandoff;
  const canChangeAssignment = workOrder.status === "rework_required" || (!workOrder.startedAt && ["pending", "accepted"].includes(workOrder.status));
  const selectedPerson = eligiblePersonnel.find((person) => person.id === assigneeId);

  const runAssignment = () => {
    startTransition(async () => {
      const result = isReassignment
        ? await reassignWorkOrderAction({ workOrderId: workOrder.id, assigneeId, reason })
        : await assignWorkOrderAction({ workOrderId: workOrder.id, assigneeId, instructions: assignmentInstructions });
      setConfirmReassignment(false);
      onResult(result);
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assigneeId || !canChangeAssignment) return;
    if (isReassignment && !reason.trim()) return;
    setConfirmReassignment(true);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Assignment" description="Repair personnel are listed by the responsible organization." />
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-normal text-slate-500">Current Assignee</p>
              <p className="mt-1 font-semibold text-slate-950">{formatPerson(workOrder.assignee?.firstName, workOrder.assignee?.lastName)}</p>
              {workOrder.assignee?.team ? <p className="mt-1 text-sm text-slate-600">{workOrder.assignee.team}</p> : null}
            </div>
            <StatusBadge tone={assignmentTone(workOrder.assignmentState)}>{assignmentLabel(workOrder.assignmentState)}</StatusBadge>
          </div>
          {workOrder.currentAssignment?.assignedAt ? <p className="mt-3 text-xs text-slate-600">Assigned {formatDateTime(workOrder.currentAssignment.assignedAt)}</p> : null}
          {workOrder.assignmentState === "pending" && workOrder.status === "in_progress" ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"><span className="font-semibold">Pending reassignment acceptance.</span> Recorded field updates are preserved and new updates are paused until the new assignee accepts.</p> : null}
          {workOrder.currentAssignment?.declineReason ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900"><span className="font-semibold">Declined:</span> {workOrder.currentAssignment.declineReason}</p> : null}
        </div>

        {canChangeAssignment ? <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-800">{isReassignment ? "Reassign To" : "Assign repair personnel"}
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70">
              <option value="">Select Organization Personnel</option>
              {eligiblePersonnel.map((person) => <option key={person.id} value={person.id}>{personName(person)}{person.availability ? ` · ${titleCase(person.availability)}` : ""}</option>)}
            </select>
          </label>
          {!isReassignment ? <label className="block text-sm font-semibold text-slate-800">Instructions (Optional)<textarea value={assignmentInstructions} onChange={event => setAssignmentInstructions(event.target.value)} maxLength={4000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm" placeholder="Add repair, access, or safety instructions" /></label> : null}
          {isReassignment ? <label className="block text-sm font-semibold text-slate-800">Reassignment Reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={2} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Explain why this assignment must change" />
          </label> : null}
          {eligiblePersonnel.length ? <Button type="submit" className="w-full" loading={pending} loadingLabel={isReassignment ? "Reassigning…" : "Assigning…"}><UsersRound className="size-4" aria-hidden="true" />{isReassignment ? "Reassign Work Order" : "Assign Repair"}</Button> : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">No repair personnel were found for this organization.</p>}
        </form> : <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Assignment is locked during active repair and review. It can be changed before repair starts or while waiting for corrective work to resume.</p>}
      </div>
      <ConfirmationDialog
        open={confirmReassignment}
        icon="none"
        title={isReassignment ? "Confirm Repair Handoff" : "Assign Repair Personnel"}
        description={isReassignment ? `Reassign ${workOrder.reference} to ${selectedPerson ? personName(selectedPerson) : "the selected repair personnel"}? Existing progress, evidence, history, and the SLA deadline will be preserved, and field updates will pause until acceptance.` : `Assign ${workOrder.reference} to ${selectedPerson ? personName(selectedPerson) : "the selected personnel"}? They will receive responsibility for this repair.`}
        confirmLabel={isReassignment ? "Reassign Personnel" : "Assign Personnel"}
        loading={pending}
        onClose={() => !pending && setConfirmReassignment(false)}
        onConfirm={runAssignment}
      >
        <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700"><span className="font-semibold">{isReassignment ? "Reason:" : "Instructions:"}</span> {isReassignment ? reason.trim() : assignmentInstructions.trim() || "No additional instructions"}</p>
      </ConfirmationDialog>
    </Card>
  );
}

function RepairActions({ workOrder, onResult }: { workOrder: WorkOrder; onResult: (result: WorkOrderActionResult) => void }) {
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotes, setDeclineNotes] = useState("");
  const [submitCompletion, setSubmitCompletion] = useState(false);
  const [progressNotes, setProgressNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmStart, setConfirmStart] = useState(false);
  const [fieldConfirmation, setFieldConfirmation] = useState<{ title: string; description: string; destructive?: boolean; operation: () => Promise<WorkOrderActionResult> } | null>(null);
  const isCorrectionResubmission = workOrder.status === "in_progress"
    && workOrder.progressPercent === 100
    && workOrder.history.some((event) => event.type === "provider_correction_requested" || event.type === "city_returned");
  const canAccept = ["pending", "in_progress", "rework_required"].includes(workOrder.status) && workOrder.assignmentState === "pending";
  const canStart = ["accepted", "rework_required"].includes(workOrder.status) && workOrder.assignmentState === "accepted";
  const canProgress = ["in_progress"].includes(workOrder.status) && workOrder.assignmentState === "accepted";

  const run = (operation: () => Promise<WorkOrderActionResult>) => {
    startTransition(async () => onResult(await operation()));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Field Repair Actions" description="Actions apply only to the currently assigned repair personnel and are revalidated by the API." />
      <div className="space-y-4 p-5">
        {canAccept ? <div className="grid gap-2 sm:grid-cols-2"><Button type="button" loading={pending} onClick={() => setFieldConfirmation({ title: "Accept Assignment", description: "Accept responsibility for this assigned repair.", operation: () => acceptWorkOrderAction(workOrder.id) })}><UserRoundCheck className="size-4" />Accept Assignment</Button><Button type="button" variant="secondary" onClick={() => document.getElementById("decline-assignment")?.focus()} disabled={pending}><XCircle className="size-4" />Decline Assignment</Button></div> : null}

        {canAccept ? <form onSubmit={(event) => { event.preventDefault(); if (!declineReason.trim()) return; setFieldConfirmation({ title: "Decline Assignment", description: `Release this assignment with the recorded reason: ${declineReason.trim()}`, destructive: true, operation: () => declineWorkOrderAction({ workOrderId: workOrder.id, reason: declineReason, notes: declineNotes }) }); }} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-semibold text-slate-800">Decline reason
            <textarea id="decline-assignment" value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} required minLength={2} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Required — for example, workload conflict or equipment issue" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">Additional notes <span className="font-normal text-slate-500">(optional)</span>
            <textarea value={declineNotes} onChange={(event) => setDeclineNotes(event.target.value)} maxLength={2000} className="mt-1 min-h-16 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
          </label>
          <Button type="submit" variant="danger" className="w-full" loading={pending} loadingLabel="Declining…">Submit Decline</Button>
        </form> : null}

        {canStart ? <Button type="button" className="w-full" loading={pending} loadingLabel="Starting…" onClick={() => setConfirmStart(true)}><Play className="size-4" />Start Repair Work</Button> : null}

        {canProgress ? <form onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const operation = async (): Promise<WorkOrderActionResult> => {
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                if (!navigator.geolocation) return reject(new Error("Location is unavailable in this browser."));
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
              });
              const location = { longitude: position.coords.longitude, latitude: position.coords.latitude };
              if (submitCompletion) {
                formData.set("longitude", String(location.longitude));
                formData.set("latitude", String(location.latitude));
                return completeRepairWorkAction(formData);
              }
              return updateRepairProgressAction({ workOrderId: workOrder.id, progressPercent: workOrder.progressPercent, notes: progressNotes, location });
            } catch {
              return { ok: false, message: "Allow current location access and enable location services, then try again." };
            }
          };
          if (submitCompletion) setFieldConfirmation({ title: "Submit for Review", description: "Submit the completed repair and final evidence to your utility provider. The incident stays open until final verification.", operation });
          else run(operation);
        }} className="space-y-4 rounded-xl border border-slate-200 p-4">
          <input type="hidden" name="workOrderId" value={workOrder.id} />
          <fieldset disabled={pending} className="space-y-3">
            <legend className="mb-3 font-semibold text-slate-950">Update Repair</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
              <input type="radio" name="updateType" value="note" checked={!submitCompletion} onChange={() => setSubmitCompletion(false)} className="mt-1 accent-blue-700" />
              <span><span className="block text-sm font-semibold">Add Progress Update</span><span className="text-sm text-slate-600">Record work performed, delays, or field conditions.</span></span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
              <input type="radio" name="updateType" value="completion" checked={submitCompletion} onChange={() => setSubmitCompletion(true)} className="mt-1 accent-blue-700" />
              <span><span className="block text-sm font-semibold">{isCorrectionResubmission ? "Resubmit Completed Repair" : "Submit Completed Repair"}</span><span className="text-sm text-slate-600">Upload final repair evidence for review.</span></span>
            </label>
            {!submitCompletion ? <label className="block text-sm font-semibold text-slate-800">Progress Notes
              <textarea name="notes" value={progressNotes} onChange={(event) => setProgressNotes(event.target.value)} required maxLength={2000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Describe work performed, materials, delays, or field conditions" />
            </label> : <label className="block text-sm font-semibold text-slate-800">Final Repair Evidence <span className="text-red-700">(required)</span><input name="finalEvidence" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" required className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800" /><span className="mt-1 block text-xs font-normal text-slate-500">JPEG, PNG, or WebP; up to 10 MB.</span></label>}
          </fieldset>
          <Button type="submit" className="w-full" loading={pending} loadingLabel="Saving…"><Wrench className="size-4" />{submitCompletion ? "Submit Completed Repair" : "Save Progress Update"}</Button>
        </form> : null}

        {workOrder.status === "completed" ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-semibold">Repair Completed · Awaiting Utility Provider Review</p><p className="mt-1">Your completion and final evidence are submitted. The incident remains open until the provider and City Engineering finish their reviews.</p></div> : null}
        {workOrder.status === "rework_required" ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-semibold">Corrective Work Requested</p><p className="mt-1">Review the provider’s recorded instructions, continue the repair, and resubmit final repair evidence.</p></div> : null}
        {!canAccept && !canStart && !canProgress && workOrder.status !== "completed" ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">This work order is waiting for its next controlled assignment or repair transition.</p> : null}
      </div>
      <ConfirmationDialog open={!!fieldConfirmation} icon="none" title={fieldConfirmation?.title ?? "Repair Action"} description={`${workOrder.reference}: ${fieldConfirmation?.description ?? ""}`} confirmLabel={fieldConfirmation?.title ?? "Continue"} destructive={fieldConfirmation?.destructive} loading={pending} onClose={() => !pending && setFieldConfirmation(null)} onConfirm={() => { if (fieldConfirmation) run(async () => { const result = await fieldConfirmation.operation(); setFieldConfirmation(null); return result; }); }} />
      <ConfirmationDialog open={confirmStart} icon="none" title="Start Repair Work" description="This records the start time and changes the work order to in progress. It does not complete or verify the repair." confirmLabel="Start Work" loading={pending} onClose={() => !pending && setConfirmStart(false)} onConfirm={() => { setConfirmStart(false); run(() => startWorkOrderAction(workOrder.id)); }} />
    </Card>
  );
}

function CompletionReviewPanel({
  workOrder,
  viewer,
  onResult,
}: {
  workOrder: WorkOrder;
  viewer: UserProfile;
  onResult: (result: WorkOrderActionResult) => void;
}) {
  const [reason, setReason] = useState("");
  const [instructions, setInstructions] = useState("");
  const [confirmation, setConfirmation] = useState<{ title: string; description: string; destructive: boolean; operation: () => Promise<WorkOrderActionResult> } | null>(null);
  const [pending, startTransition] = useTransition();
  const isProvider = viewer.backendRole === "utility_provider" && viewer.permissions.includes("work_orders.manage");
  const isCityEngineer = viewer.backendRole === "city_engineer" && viewer.permissions.includes("repairs.verify");
  const canProviderReview = isProvider && workOrder.status === "completed";
  const canCoordinateCorrection = isProvider && workOrder.status === "city_correction_required";
  const canFinalReview = isCityEngineer && workOrder.status === "provider_accepted";

  const run = (operation: () => Promise<WorkOrderActionResult>) => {
    startTransition(async () => onResult(await operation()));
  };

  if (!canProviderReview && !canCoordinateCorrection && !canFinalReview) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={canProviderReview ? "Completion Review" : canCoordinateCorrection ? "Coordinate Corrective Work" : "City Engineering Final Verification"}
        description={canProviderReview
          ? "Accept the repair to send it to City Engineering, or return it to repair personnel for correction."
          : canCoordinateCorrection
            ? "City Engineering returned this repair. Add instructions for the assigned Repair Personnel before restarting work."
            : "Verify the repair to resolve the incident, or return it to the Utility Provider for correction."}
      />
      <div className="space-y-4 p-5">
        {canProviderReview ? <>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="provider-review-note">Review Note
            <textarea id="provider-review-note" aria-describedby="provider-review-note-help" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
          </label>
          <p id="provider-review-note-help" className="text-xs leading-5 text-slate-500">A note is required when returning the repair for correction.</p>
          <div className="grid gap-2">
            <Button type="button" loading={pending} onClick={() => setConfirmation({ title: "Accept Repair", description: "Forward this completed repair to City Engineering for final verification.", destructive: false, operation: () => reviewCompletedWorkAction({ workOrderId: workOrder.id, decision: "accepted", reason }) })}><ClipboardCheck className="size-4 shrink-0" />Accept Repair</Button>
            <Button type="button" variant="danger" loading={pending} disabled={reason.trim().length < 2} onClick={() => setConfirmation({ title: "Return for Correction", description: "Return this repair to the assigned personnel with the recorded correction instructions.", destructive: true, operation: () => reviewCompletedWorkAction({ workOrderId: workOrder.id, decision: "request_correction", reason, instructions: reason }) })}><Wrench className="size-4 shrink-0" />Return for Correction</Button>
          </div>
        </> : null}
        {canCoordinateCorrection ? <>
          <label className="block text-sm font-semibold text-slate-800">Corrective Instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} required minLength={2} maxLength={4000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Explain the City Engineering return and the work needed" /></label>
          <Button type="button" className="w-full" loading={pending} disabled={instructions.trim().length < 2} onClick={() => setConfirmation({ title: "Send Correction to Personnel", description: "Send these corrective instructions to the assigned personnel so corrective work can resume.", destructive: false, operation: () => coordinateCityCorrectionAction({ workOrderId: workOrder.id, instructions }) })}><Wrench className="size-4" />Send Correction to Repair Personnel</Button>
        </> : null}
        {canFinalReview ? <>
          <label className="block text-sm font-semibold text-slate-800">Review Note
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
          </label>
          <p className="text-xs leading-5 text-slate-500">A note is required when returning the repair for correction.</p>
          <div className="grid gap-2">
            <Button type="button" loading={pending} onClick={() => setConfirmation({ title: "Verify and Resolve", description: "Verify the repair and resolve the linked incident. This is the final approval.", destructive: false, operation: () => finalReviewWorkOrderAction({ workOrderId: workOrder.id, decision: "approved", reason }) })}><ClipboardCheck className="size-4" />Verify &amp; Resolve</Button>
            <Button type="button" variant="danger" loading={pending} disabled={reason.trim().length < 2} onClick={() => setConfirmation({ title: "Return to Provider", description: "Return this repair to the utility provider with the recorded reason.", destructive: true, operation: () => finalReviewWorkOrderAction({ workOrderId: workOrder.id, decision: "return", reason }) })}><Wrench className="size-4" />Return for Correction</Button>
          </div>
        </> : null}
      </div>
      <ConfirmationDialog open={!!confirmation} icon="none" title={confirmation?.title ?? "Review Work Order"} description={`${workOrder.reference}: ${confirmation?.description ?? ""}`} confirmLabel={confirmation?.title ?? "Continue"} destructive={confirmation?.destructive} loading={pending} onClose={() => !pending && setConfirmation(null)} onConfirm={() => { if (confirmation) run(async () => { const result = await confirmation.operation(); setConfirmation(null); return result; }); }}>
        {(reason.trim() || instructions.trim()) ? <p className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap">{canCoordinateCorrection ? instructions.trim() : reason.trim()}</p> : null}
      </ConfirmationDialog>
    </Card>
  );
}

function EvidenceGallery({ title, description, evidence, latestOnly = false }: { title: string; description: string; evidence: WorkOrder["evidence"]; latestOnly?: boolean }) {
  const visibleEvidence = latestOnly && evidence.length
    ? [evidence.reduce((latest, item) => {
      const latestTime = Date.parse(latest.uploadedAt ?? "");
      const itemTime = Date.parse(item.uploadedAt ?? "");
      return !Number.isFinite(latestTime) || !Number.isFinite(itemTime) || itemTime >= latestTime ? item : latest;
    })]
    : evidence;
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} description={description} className="py-3" />
      {visibleEvidence.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3 p-5">{visibleEvidence.map((item, index) => <div key={`${item.id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-4/3 bg-slate-100"><img src={item.url} alt={`${title} ${index + 1}`} className="size-full object-cover" /></a> : <div className="flex aspect-4/3 items-center justify-center text-slate-500"><FileImage className="size-8" aria-hidden="true" /></div>}
        <div className="space-y-1 border-t border-slate-200 px-3 py-2.5 text-xs text-slate-600">{item.caption ? <p>{item.caption}</p> : null}{item.uploadedAt ? <p>Uploaded {formatDateTime(item.uploadedAt)}</p> : null}{item.mimeType ? <p>{item.mimeType}</p> : null}</div>
      </div>)}</div> : <p className="p-5 text-sm text-slate-600">No {title.toLowerCase()} uploaded yet.</p>}
    </Card>
  );
}

function WorkOrderTimeline({ workOrder }: { workOrder: WorkOrder }) {
  const events = useMemo(() => distinctTimelineEvents(
    [...workOrder.history].sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? "")),
    (entry) => ({ timestamp: entry.createdAt, values: [entry.type, entry.status, entry.progressPercent, entry.stage, entry.actorRole, entry.notes?.trim() ?? ""] }),
  ), [workOrder.history]);
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Operational Timeline" />
      {events.length ? <ol className="space-y-6 p-5">{events.map((entry, index) => <li key={entry.id} className="flex gap-4"><TimelineMarker latest={index === 0} last={index === events.length - 1} /><div className="min-w-0 flex-1 wrap-break-word"><div className="flex flex-col gap-0.5"><p className="text-sm font-semibold leading-6 text-slate-900">{entry.type === "ready_for_completion" ? "Completion Submitted" : (timelineEventLabel(entry.type ?? entry.status ?? "Work Order Update"))}</p>{entry.createdAt ? <time dateTime={entry.createdAt} className="text-xs leading-5 text-slate-500">{formatDateTime(entry.createdAt)}</time> : null}</div>{entry.notes ? <p className="mt-1 text-sm leading-6 text-slate-600">{timelineNoteLabel(entry.notes)}</p> : null}{workOrder.reviews.filter((review) => review.createdAt === entry.createdAt && review.stage === entry.actorRole && review.instructions && review.instructions !== entry.notes).map((review) => <p key={review.id} className="mt-1 text-sm leading-6 text-slate-600">Instructions: {review.instructions}</p>)}</div></li>)}</ol> : <p className="p-5 text-sm text-slate-600">No work-order events are available yet.</p>}
    </Card>
  );
}

function AssignmentHistory({ assignments }: { assignments: WorkOrder["assignments"] }) {
  const [expanded, setExpanded] = useState(false);
  const previous = assignments.map((assignment, index) => ({ assignment, index }))
    .filter(({ assignment }) => assignment.active !== true && (assignment.endedAt || assignment.status === "reassigned" || assignment.status === "declined"))
    .sort((a, b) => (b.assignment.assignedAt ?? "").localeCompare(a.assignment.assignedAt ?? "") || b.index - a.index)
    .map(({ assignment }) => assignment);
  const visible = expanded ? previous : previous.slice(0, 3);
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Assignment History" />
      {visible.length ? <ol className="divide-y divide-slate-200">
        {visible.map((assignment) => <li key={assignment.id} className="space-y-3 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">{formatPerson(assignment.assignee?.firstName, assignment.assignee?.lastName)}</p>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1"><dt className="text-slate-500">Assigned</dt><dd className="leading-5 text-slate-800">{assignment.assignedAt ? formatDateTime(assignment.assignedAt) : "Unavailable"}</dd></div>
            <div className="space-y-1"><dt className="text-slate-500">Ended</dt><dd className="leading-5 text-slate-800">{assignment.endedAt ? formatDateTime(assignment.endedAt) : "Unavailable"}</dd></div>
          </dl>
          {assignment.endedReason || assignment.declineReason ? <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-xs text-slate-500">Reassignment Reason</p><p className="mt-1 text-sm leading-5 text-slate-700 wrap-break-word">{assignment.endedReason || assignment.declineReason}</p></div> : null}
        </li>)}
      </ol> : <p className="p-5 text-sm text-slate-600">No previous assignments.</p>}
      {previous.length > 3 ? <div className="border-t border-slate-200 px-3 py-2">
        <Button type="button" variant="ghost" size="sm" className="w-full text-brand-700" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show Less History" : "Show All History"}</Button>
      </div> : null}
    </Card>
  );
}

export function WorkOrderDetail({
  viewer,
  workOrder,
  eligiblePersonnel = [],
}: {
  viewer: UserProfile;
  workOrder: WorkOrder;
  eligiblePersonnel?: EligibleRepairPersonnel[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [notice, setNotice] = useState<{ message: string; kind: "success" | "error" }>();
  const official = viewer.backendRole === "utility_provider" && viewer.permissions.includes("work_orders.manage");
  const repairAssignee = viewer.backendRole === "repair_personnel" && workOrder.assignee?.id === viewer.id;
  const incidentLocation = workOrder.incident?.location;
  const [longitude, latitude] = incidentLocation?.coordinates ?? [];
  const mapsHref = typeof longitude === "number" && typeof latitude === "number"
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
    : undefined;
  const result = (actionResult: WorkOrderActionResult) => {
    const kind = actionResult.ok ? "success" : "error";
    setNotice({ message: actionResult.message, kind });
    notify({ title: actionResult.ok ? "Work order updated" : "Action not completed", message: actionResult.message, tone: kind === "success" ? "success" : "error" });
    if (actionResult.ok || actionResult.conflict) router.refresh();
  };

  return (
    <div className="mx-auto max-w-370">
      <Breadcrumbs items={[{ label: "Work Orders", href: "/work-orders" }, { label: workOrder.reference }]} />
      <PageHeader
        eyebrow={`${workOrder.responsibleOrganization ?? "Maintenance"} · ${workOrder.jurisdiction?.barangay ?? "Authorized Scope"}`}
        title={workOrder.reference}
        description={workOrder.incident?.category ? `${categoryLabel(workOrder.incident.category)} repair work order` : "Maintenance work order"}
      />
      <ActionNotice message={notice?.message} kind={notice?.kind} />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="space-y-2 px-4 py-3">
          <p className="text-xs font-semibold leading-5 text-slate-500">Repair Status</p>
          <div className="flex min-h-6 items-center"><StatusBadge tone={workOrderStatusTone(workOrder.status)}>{workOrderStatusLabel(workOrder.status, workOrder.assignmentState)}</StatusBadge></div>
        </Card>
        <Card className="space-y-2 px-4 py-3">
          <p className="text-xs font-semibold leading-5 text-slate-500">SLA Deadline</p>
          {workOrder.sla.deadline ? <div className="space-y-1">
            <p className="text-sm font-semibold leading-6 text-slate-900">{formatDateTime(workOrder.sla.deadline)}</p>
            <p className="text-xs leading-5 text-slate-600">{formatRemaining(workOrder.sla.remainingMilliseconds) ?? "Remaining time unavailable"}</p>
          </div> : <p className="text-sm leading-6 text-slate-600">No deadline returned</p>}
        </Card>
        <Card className="space-y-2 px-4 py-3">
          <p className="text-xs font-semibold leading-5 text-slate-500">SLA State</p>
          <div className="flex min-h-6 flex-wrap items-center gap-3"><SlaBadges sla={workOrder.sla} /><StatusBadge tone={priorityTone(workOrder.priority)}>{titleCase(workOrder.priority)}</StatusBadge></div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="Incident and Work Details" />
            <div className="space-y-5 p-5 sm:p-6">
              <dl className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Incident Reference</dt>
                  <dd className="mt-1.5 wrap-break-word text-base font-semibold text-slate-950">{workOrder.incident?.reportNumber ?? "Unavailable"}</dd>
                  <dd className="mt-2"><Badge tone="information">{categoryLabel(workOrder.incident?.category, "Uncategorized")}</Badge></dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Responsible Organization</dt>
                  <dd className="mt-1.5 text-sm font-semibold leading-6 text-slate-900">{workOrder.responsibleOrganization ?? "Not routed"}</dd>
                </div>
              </dl>
              <div className="grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="text-xs font-medium text-slate-500">Location</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-700">{formatLocation(incidentLocation)}</p>
                    {mapsHref ? <a href={mapsHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 hover:underline">Open Directions <ExternalLink className="size-3.5" aria-hidden="true" /></a> : null}
                  </div>
                </div>
                <dl className="space-y-3">
                  <div><dt className="text-xs font-medium text-slate-500">Created</dt><dd className="mt-1 text-sm text-slate-700">{workOrder.createdAt ? formatDateTime(workOrder.createdAt) : "Unavailable"}</dd></div>
                  {workOrder.startedAt ? <div><dt className="text-xs font-medium text-slate-500">Initial Repair Started</dt><dd className="mt-1 text-sm text-slate-700">{formatDateTime(workOrder.startedAt)}</dd></div> : null}
                </dl>
              </div>
              <section className="border-t border-slate-200 pt-5" aria-label="Description">
                <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-600">{workOrder.incident?.description ?? "No citizen description is available."}</p>
              </section>
              <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4" aria-label="Work Instructions">
                <h3 className="text-sm font-semibold text-brand-900">Work Instructions</h3>
                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">{workOrder.instructions ?? "No additional work instructions were provided."}</p>
              </section>
            </div>
          </Card>

          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <EvidenceGallery title="Citizen Evidence" description="Photo submitted with the citizen report." evidence={workOrder.incident?.images ?? []} />
            <EvidenceGallery title="Repair Field Evidence" description="Latest repair photo submitted for review." evidence={workOrder.evidence} latestOnly />
          </div>
          <WorkOrderTimeline workOrder={workOrder} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {official ? <AssignmentPanel workOrder={workOrder} eligiblePersonnel={eligiblePersonnel} onResult={result} /> : null}
          {repairAssignee ? <><RepairActions workOrder={workOrder} onResult={result} /></> : null}
          <CompletionReviewPanel workOrder={workOrder} viewer={viewer} onResult={result} />
          <AssignmentHistory assignments={workOrder.assignments} />
          <Link href="/work-orders" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"><Route className="size-4" />Return to Work Orders<ChevronRight className="size-4" /></Link>
        </aside>
      </div>
    </div>
  );
}
