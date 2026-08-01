import type { Metadata } from "next";
import { MaintenanceState, type MaintenanceMode } from "@/app/(public)/maintenance/maintenance-state";

export const metadata: Metadata = { title: "System Maintenance" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function clean(value: string | undefined, maxLength: number) {
  return value?.trim().slice(0, maxLength) || undefined;
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const modeParam = first(params.mode);
  const mode: MaintenanceMode = modeParam === "service" || modeParam === "read-only" ? modeParam : "full";

  return (
    <MaintenanceState
      mode={mode}
      message={clean(first(params.message), 240)}
      service={clean(first(params.service), 100)}
      restorationTime={clean(first(params.until), 100)}
      loginAvailable={first(params.login) !== "restricted"}
    />
  );
}
