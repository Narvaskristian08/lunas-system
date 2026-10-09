import { redirect } from "next/navigation";
import { ValidationQueue } from "@/components/validation/validation-queue";
import { requirePermission } from "@/lib/auth/dal.server";
import { getValidationQueue, getValidationSummary, readValidationFilters } from "@/lib/validation.server";

export default async function ValidationRoutingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requirePermission("reports.view");
  const params = await searchParams;
  if (viewer.backendRole === "city_engineer") {
    const query = new URLSearchParams({ view: "review" });
    for (const [key, value] of Object.entries(params)) if (typeof value === "string" && key !== "view") query.set(key, value);
    redirect(`/work-orders?${query.toString()}`);
  }
  const filters = readValidationFilters(params);
  const [queue, summaryResult] = await Promise.all([
    getValidationQueue(filters),
    getValidationSummary().then((summary) => ({ summary })).catch(() => ({ summary: undefined })),
  ]);

  return (
    <ValidationQueue
      key={JSON.stringify(filters)}
      viewer={viewer}
      queue={queue}
      filters={filters}
      summary={summaryResult.summary}
      summaryUnavailable={!summaryResult.summary}
    />
  );
}
