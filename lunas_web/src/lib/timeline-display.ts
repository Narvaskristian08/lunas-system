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
    "barangay validation completed; forwarded to city engineering": "Barangay Validation Completed; Forwarded to City Engineering",
    "city engineering confirmed the incident": "City Engineering Confirmed the Incident",
    "jurisdiction confirmed": "Jurisdiction Confirmed",
    "work order created from validated incident": "Work Order Created from Validated Incident",
    "repair personnel assigned": "Repair Personnel Assigned",
    "repair assignment reassigned": "Repair Assignment Reassigned",
    "repair assignment declined; awaiting reassignment": "Repair Assignment Declined; Awaiting Reassignment",
    "corrective repair work started": "Corrective Repair Work Started",
    "repair work started": "Repair Work Started",
    "utility provider accepted the repair and forwarded it for city engineering verification": "Utility Provider Accepted the Repair and Forwarded It for City Engineering Verification",
    "city engineering verified the repair and closed the incident": "City Engineering Verified the Repair and Closed the Incident",
  };
  return automaticNotes[value.trim().toLowerCase()] ?? value;
}
