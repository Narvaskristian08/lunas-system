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
  } as Record<string, string>)[status];
}
