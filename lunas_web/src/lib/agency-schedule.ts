export interface AgencySchedule {
  state: "active" | "awaiting_start" | "awaiting_schedule" | "awaiting_verification" | "resolved" | "inactive";
  asOf: string;
  deadline: string | null;
  startedAt: string | null;
  stoppedAt: string | null;
  durationMilliseconds: number | null;
  remainingMilliseconds: number | null;
}

export function normalizeAgencySchedule(value: unknown): AgencySchedule | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const states = ["active", "awaiting_start", "awaiting_schedule", "awaiting_verification", "resolved", "inactive"];
  if (!states.includes(String(record.state))) return undefined;
  const date = (key: string) => typeof record[key] === "string" && Number.isFinite(Date.parse(record[key] as string)) ? record[key] as string : null;
  const number = (key: string) => typeof record[key] === "number" && Number.isFinite(record[key]) ? record[key] as number : null;
  return { state: record.state as AgencySchedule["state"], asOf: date("asOf") || "", deadline: date("deadline"), startedAt: date("startedAt"), stoppedAt: date("stoppedAt"), durationMilliseconds: number("durationMilliseconds"), remainingMilliseconds: number("remainingMilliseconds") };
}

export function remainingTimeLabel(milliseconds: number) {
  if (Math.abs(milliseconds) < 60000) return `Less than a minute ${milliseconds > 0 ? "remaining" : "past deadline"}`;
  const minutes = Math.max(1, Math.ceil(Math.abs(milliseconds) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const parts = [days ? `${days}d` : "", hours ? `${hours}h` : "", mins ? `${mins}m` : ""].filter(Boolean);
  return `${parts.join(" ")} ${milliseconds > 0 ? "remaining" : "past deadline"}`;
}

// datetime-local values represent Philippine civil time, independent of server TZ.
export function philippineDeadlineInput(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 16) : "";
}
export function philippineDeadlineIso(value: string) {
  const local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value);
  if (!local && !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) return undefined;
  const date = new Date(local ? `${value}+08:00` : value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}
