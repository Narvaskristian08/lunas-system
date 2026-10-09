"use client";

import { categoryLabel } from "@/lib/category-label";

import { distinctTimelineEvents, timelineEventLabel, timelineNoteLabel } from "@/lib/timeline-display";

/* Signed evidence URLs are supplied by the protected API and should not be optimized by Next image. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
  return formatPerson(person.firstName, person.lastName, "Eligible repair personnel");
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
  const [confirmReassignment, setConfirmReassignment] = useState(false);
  const [pending, startTransition] = useTransition();
  const hasAssignment = Boolean(workOrder.currentAssignment || workOrder.assignee);
  const isDeclinedHandoff = workOrder.status === "in_progress" && workOrder.assignmentState === "declined";
  const isReassignment = hasAssignment || isDeclinedHandoff;
  const canChangeAssignment = ["pending", "accepted", "in_progress", "rework_required", "declined", "reassigned"].includes(workOrder.status);
  const selectedPerson = eligiblePersonnel.find((person) => person.id === assigneeId);

  const runAssignment = () => {
    startTransition(async () => {
      const result = isReassignment
        ? await reassignWorkOrderAction({ workOrderId: workOrder.id, assigneeId, reason })
        : await assignWorkOrderAction({ workOrderId: workOrder.id, assigneeId });
      setConfirmReassignment(false);
      onResult(result);
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assigneeId || !canChangeAssignment) return;
    if (isReassignment && !reason.trim()) return;
    if (isReassignment) {
      setConfirmReassignment(true);
      return;
    }
    runAssignment();
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
            <StatusBadge tone={assignmentTone(workOrder.assignmentState)}>{titleCase(workOrder.assignmentState)}</StatusBadge>
          </div>
          {workOrder.currentAssignment?.assignedAt ? <p className="mt-3 text-xs text-slate-600">Assigned {formatDateTime(workOrder.currentAssignment.assignedAt)}</p> : null}
          {workOrder.assignmentState === "pending" && workOrder.status === "in_progress" ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"><span className="font-semibold">Pending reassignment acceptance.</span> Recorded field updates are preserved and new updates are paused until the new assignee accepts.</p> : null}
          {workOrder.currentAssignment?.declineReason ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900"><span className="font-semibold">Declined:</span> {workOrder.currentAssignment.declineReason}</p> : null}
        </div>

        {canChangeAssignment ? <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-800">{isReassignment ? "Reassign to" : "Assign repair personnel"}
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70">
              <option value="">Select Organization Personnel</option>
              {eligiblePersonnel.map((person) => <option key={person.id} value={person.id}>{personName(person)}{person.team ? ` · ${person.team}` : ""}{person.availability ? ` · ${titleCase(person.availability)}` : ""}</option>)}
            </select>
          </label>
          {isReassignment ? <label className="block text-sm font-semibold text-slate-800">Reassignment reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={2} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Explain why this assignment must change" />
          </label> : null}
          {eligiblePersonnel.length ? <Button type="submit" className="w-full" loading={pending} loadingLabel={isReassignment ? "Reassigning…" : "Assigning…"}><UsersRound className="size-4" aria-hidden="true" />{isReassignment ? "Reassign work order" : "Assign work order"}</Button> : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">No repair personnel were found for this organization.</p>}
        </form> : <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">Assignment is locked while this work awaits provider or City Engineering review.</p>}
      </div>
      <ConfirmationDialog
        open={confirmReassignment}
        icon="none"
        title="Confirm Repair Handoff"
        description={`Reassign ${workOrder.reference} to ${selectedPerson ? personName(selectedPerson) : "the selected repair personnel"}? Existing progress, evidence, history, and the SLA deadline will be preserved, and field updates will pause until acceptance.`}
        confirmLabel="Confirm Reassignment"
        loading={pending}
        onClose={() => !pending && setConfirmReassignment(false)}
        onConfirm={runAssignment}
      >
        <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700"><span className="font-semibold">Reason:</span> {reason.trim()}</p>
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
        {canAccept ? <div className="grid gap-2 sm:grid-cols-2"><Button type="button" loading={pending} onClick={() => run(() => acceptWorkOrderAction(workOrder.id))}><UserRoundCheck className="size-4" />Accept Assignment</Button><Button type="button" variant="secondary" onClick={() => document.getElementById("decline-assignment")?.focus()} disabled={pending}><XCircle className="size-4" />Decline Assignment</Button></div> : null}

        {canAccept ? <form onSubmit={(event) => { event.preventDefault(); if (!declineReason.trim()) return; run(() => declineWorkOrderAction({ workOrderId: workOrder.id, reason: declineReason, notes: declineNotes })); }} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
          run(async () => {
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
          });
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
        title={canProviderReview ? "Utility Provider Completion Review" : canCoordinateCorrection ? "Coordinate Corrective Work" : "City Engineering Final Verification"}
        description={canProviderReview
          ? "Review the repair notes and final evidence before accepting the work or returning it for correction."
          : canCoordinateCorrection
            ? "City Engineering returned this repair. Add instructions for the assigned Repair Personnel before restarting work."
            : "Provider acceptance is a handoff, not closure. Approve the repair or return it to the Utility Provider with a reason."}
      />
      <div className="space-y-4 p-5">
        {canProviderReview ? <>
          <label className="block text-sm font-semibold text-slate-800">Review note or correction reason {<span className="font-normal text-slate-500">(required for correction)</span>}
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Explain what must change, if any" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">Repair instructions <span className="font-normal text-slate-500">(used for corrective work)</span>
            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={4000} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" loading={pending} onClick={() => run(() => reviewCompletedWorkAction({ workOrderId: workOrder.id, decision: "accepted", reason, instructions }))}><ClipboardCheck className="size-4" />Accept and Forward to City Engineering</Button>
            <Button type="button" variant="danger" loading={pending} disabled={reason.trim().length < 2} onClick={() => run(() => reviewCompletedWorkAction({ workOrderId: workOrder.id, decision: "request_correction", reason, instructions }))}><Wrench className="size-4" />Request Corrective Work</Button>
          </div>
        </> : null}
        {canCoordinateCorrection ? <>
          <label className="block text-sm font-semibold text-slate-800">Corrective instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} required minLength={2} maxLength={4000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Explain the City Engineering return and the work needed" /></label>
          <Button type="button" className="w-full" loading={pending} disabled={instructions.trim().length < 2} onClick={() => run(() => coordinateCityCorrectionAction({ workOrderId: workOrder.id, instructions }))}><Wrench className="size-4" />Send Correction to Repair Personnel</Button>
        </> : null}
        {canFinalReview ? <>
          <label className="block text-sm font-semibold text-slate-800">Final review note or return reason {<span className="font-normal text-slate-500">(required when returning)</span>}
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" loading={pending} onClick={() => run(() => finalReviewWorkOrderAction({ workOrderId: workOrder.id, decision: "approved", reason }))}><ClipboardCheck className="size-4" />Verify and Resolve Incident</Button>
            <Button type="button" variant="danger" loading={pending} disabled={reason.trim().length < 2} onClick={() => run(() => finalReviewWorkOrderAction({ workOrderId: workOrder.id, decision: "return", reason }))}><Wrench className="size-4" />Return to Utility Provider</Button>
          </div>
        </> : null}
      </div>
    </Card>
  );
}

function EvidenceGallery({ title, description, evidence }: { title: string; description: string; evidence: WorkOrder["evidence"] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} description={description} />
      {evidence.length ? <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] gap-3 p-5">{evidence.map((item, index) => <div key={`${item.id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-slate-100"><img src={item.url} alt={`${title} ${index + 1}`} className="size-full object-cover" /></a> : <div className="flex aspect-[4/3] items-center justify-center text-slate-500"><FileImage className="size-8" aria-hidden="true" /></div>}
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
      <CardHeader title="Operational Timeline" description="Append-oriented work-order events returned by the backend." />
      {events.length ? <ol className="divide-y divide-slate-200">{events.map((entry) => <li key={entry.id} className="flex gap-3 px-5 py-4"><span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-700" aria-hidden="true" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{entry.type === "ready_for_completion" ? "Completion Submitted" : (timelineEventLabel(entry.type ?? entry.status ?? "Work Order Update"))}</p></div>{entry.notes ? <p className="mt-1 text-sm leading-6 text-slate-600">{timelineNoteLabel(entry.notes)}</p> : null}{workOrder.reviews.filter((review) => review.createdAt === entry.createdAt && review.stage === entry.actorRole && review.instructions && review.instructions !== entry.notes).map((review) => <p key={review.id} className="mt-1 text-sm leading-6 text-slate-600">Instructions: {review.instructions}</p>)}{entry.createdAt ? <p className="mt-1.5 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p> : null}</div></li>)}</ol> : <p className="p-5 text-sm text-slate-600">No work-order events are available yet.</p>}
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
    <div className="mx-auto max-w-[1480px]">
      <Breadcrumbs items={[{ label: "Work Orders", href: "/work-orders" }, { label: workOrder.reference }]} />
      <PageHeader
        eyebrow={`${workOrder.responsibleOrganization ?? "Maintenance"} · ${workOrder.jurisdiction?.barangay ?? "Authorized Scope"}`}
        title={workOrder.reference}
        description={workOrder.incident?.category ? `${categoryLabel(workOrder.incident.category)} repair work order` : "Maintenance work order"}
        actions={<><StatusBadge tone={workOrderStatusTone(workOrder.status)}>{workOrder.status === "completed" ? "Completed · provider review" : titleCase(workOrder.status)}</StatusBadge><StatusBadge tone={priorityTone(workOrder.priority)}>{titleCase(workOrder.priority)}</StatusBadge></>}
      />
      <ActionNotice message={notice?.message} kind={notice?.kind} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-bold tracking-normal text-slate-500">Repair Status</p><p className="mt-2 text-sm font-semibold text-slate-900">{workOrder.status === "verified" ? "Closed" : workOrderStatusLabel(workOrder.status)}</p></Card>
        <Card className="p-4"><p className="text-xs font-bold tracking-normal text-slate-500">Assignment</p><p className="mt-2 font-semibold text-slate-950">{formatPerson(workOrder.assignee?.firstName, workOrder.assignee?.lastName)}</p><StatusBadge className="mt-2" tone={assignmentTone(workOrder.assignmentState)}>{titleCase(workOrder.assignmentState)}</StatusBadge></Card>
        <Card className="p-4"><p className="text-xs font-bold tracking-normal text-slate-500">SLA Deadline</p>{workOrder.sla.deadline ? <><p className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(workOrder.sla.deadline)}</p><p className="mt-1 text-xs text-slate-600">{formatRemaining(workOrder.sla.remainingMilliseconds) ?? "Deadline supplied by backend"}</p></> : <p className="mt-2 text-sm text-slate-600">No deadline returned</p>}{workOrder.sla.targetResolutionTime ? <p className="mt-1 text-xs text-slate-600">Target: {workOrder.sla.targetResolutionTime} hours</p> : null}</Card>
        <Card className="p-4"><p className="text-xs font-bold tracking-normal text-slate-500">SLA State</p><div className="mt-2"><SlaBadges sla={workOrder.sla} /></div><p className="mt-2 text-xs text-slate-600">State is calculated by the backend.</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="Incident and Work Details" />
            <div className="space-y-5 p-5 sm:p-6">
              <dl className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Incident Reference</dt>
                  <dd className="mt-1.5 break-words text-base font-semibold text-slate-950">{workOrder.incident?.reportNumber ?? "Unavailable"}</dd>
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
                  {workOrder.startedAt ? <div><dt className="text-xs font-medium text-slate-500">Repair Started</dt><dd className="mt-1 text-sm text-slate-700">{formatDateTime(workOrder.startedAt)}</dd></div> : null}
                </dl>
              </div>
              <section className="border-t border-slate-200 pt-5" aria-label="Description">
                <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{workOrder.incident?.description ?? "No citizen description is available."}</p>
              </section>
              <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4" aria-label="Work Instructions">
                <h3 className="text-sm font-semibold text-brand-900">Work Instructions</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{workOrder.instructions ?? "No additional work instructions were provided."}</p>
              </section>
            </div>
          </Card>

          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <EvidenceGallery title="Citizen Evidence" description="Short-lived signed evidence URLs are supplied by the protected API. New evidence is privacy-redacted before storage." evidence={workOrder.incident?.images ?? []} />
            <EvidenceGallery title="Repair Field Evidence" description="Traceable maintenance evidence uploaded during repair progress is privacy-redacted before storage." evidence={workOrder.evidence} />
          </div>
          <WorkOrderTimeline workOrder={workOrder} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {official ? <AssignmentPanel workOrder={workOrder} eligiblePersonnel={eligiblePersonnel} onResult={result} /> : null}
          {repairAssignee ? <><RepairActions workOrder={workOrder} onResult={result} /></> : null}
          <CompletionReviewPanel workOrder={workOrder} viewer={viewer} onResult={result} />
          <Card className="overflow-hidden"><CardHeader title="Assignment History" description="Previous assignments remain available for audit and reassignment context." />{workOrder.assignments.length ? <ol className="divide-y divide-slate-200">{workOrder.assignments.map((assignment) => <li key={assignment.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-900">{formatPerson(assignment.assignee?.firstName, assignment.assignee?.lastName)}</p><StatusBadge tone={assignmentTone(assignment.status)}>{titleCase(assignment.status)}</StatusBadge></div>{assignment.assignedAt ? <p className="mt-1 text-xs text-slate-600">Assigned {formatDateTime(assignment.assignedAt)}</p> : null}{assignment.endedAt ? <p className="mt-1 text-xs text-slate-600">Ended {formatDateTime(assignment.endedAt)}</p> : null}{assignment.declineReason ? <p className="mt-2 text-sm leading-6 text-red-800">Decline Reason: {assignment.declineReason}</p> : null}{assignment.endedReason ? <p className="mt-2 text-sm leading-6 text-slate-600">Reassignment: {assignment.endedReason}</p> : null}</li>)}</ol> : <p className="p-5 text-sm text-slate-600">No assignment history is available yet.</p>}</Card>
          <Link href="/work-orders" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"><Route className="size-4" />Return to Work Orders<ChevronRight className="size-4" /></Link>
        </aside>
      </div>
    </div>
  );
}
