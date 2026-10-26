/** Remove adjacent duplicate display events; retain events with missing dates. */
export function distinctTimelineEvents<T>(
  events: readonly T[],
  details: (event: T) => { timestamp?: string; values: unknown[] },
): T[] {
  let previousKey: string | undefined;
  return events.filter((event) => {
    const { timestamp, values } = details(event);
    const time = timestamp ? Date.parse(timestamp) : NaN;
    const key = Number.isFinite(time)
      ? JSON.stringify([Math.floor(time / 60000), ...values])
      : undefined;
    const duplicate = key !== undefined && key === previousKey;
    previousKey = key;
    return !duplicate;
  });
}
/** Short milestone labels for the visible report timeline. */
export function timelineMilestoneLabel(status: string): string | undefined {
  return ({
    tanod_assigned: "Committee Staff Inspection Assigned",
    tanod_in_progress: "Committee Staff Inspection In Progress",
    tanod_verified: "Committee Staff Verification Submitted",
    tanod_rejected: "Committee Staff Verification Rejected",
    pending_budget: "Pending Agency Budget",
    pending_procurement: "Pending Agency Procurement / Bidding",
    work_in_progress: "Agency Work In Progress",
    work_completed: "Agency Reported Work Completed",
    correction_required: "Agency Correction Requested",
    completed: "Repair Completed",
    repair_completed: "Repair Completed",
    provider_review: "Sent for Provider Review",
    provider_accepted: "Repair Approved by Utility Provider",
    city_verification: "Sent for City Engineering Review",
    verified: "Repair Verified by City Engineering",
    city_verified: "Repair Verified by City Engineering",
    resolved: "Report Resolved",
    closed: "Report Resolved",
  } as Record<string, string>)[status.trim().toLowerCase()];
}

/** Format fallback event labels while retaining standard acronyms. */
export function timelineEventLabel(value: string): string {
  return timelineMilestoneLabel(value) ?? value.trim().toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w+/g, (word) => ["ai", "gps", "sla", "id"].includes(word)
      ? word.toUpperCase()
      : ["in", "for", "by", "to", "of", "and"].includes(word) ? word
        : word[0].toUpperCase() + word.slice(1))
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

/** Normalize known automatic notes without changing reviewer-authored text. */
export function timelineNoteLabel(value: string): string {
  const automaticNotes: Record<string, string> = {
    "incident reported": "Incident Reported",
    "barangay validation completed; forwarded to city engineering": "Infrastructure Committee Validation Completed; Forwarded to City Engineering",
    "city engineering confirmed the incident": "City Engineering Confirmed the Incident",
    "jurisdiction confirmed": "Jurisdiction Confirmed",
    "work order created from validated incident": "Work Order Created from Validated Incident",
    "repair personnel assigned": "Utility Personnel Assigned",
    "tanod inspection assigned": "Committee Staff Inspection Assigned",
    "tanod started inspection": "Committee Staff Inspection Started",
    "tanod submitted inspection findings": "Committee Staff Submitted Inspection Findings",
    "secretary approved verification; report automatically routed to agency": "Infrastructure Committee Approved Verification; Report Routed to Agency",
    "agency reported work completed": "Agency Reported Work Completed",
    "repair assignment reassigned": "Repair Assignment Reassigned",
    "repair assignment declined; awaiting reassignment": "Repair Assignment Declined; Awaiting Reassignment",
    "corrective repair work started": "Corrective Repair Work Started",
    "repair work started": "Repair Work Started",
    "utility provider accepted the repair and forwarded it for city engineering verification": "Utility Provider Accepted the Repair and Forwarded It for City Engineering Verification",
    "city engineering verified the repair and closed the incident": "City Engineering Verified the Repair and Closed the Incident",
  };
  return automaticNotes[value.trim().toLowerCase()] ?? value;
}
