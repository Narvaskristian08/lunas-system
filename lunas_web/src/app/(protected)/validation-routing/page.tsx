import { ValidationQueue } from "@/components/validation/validation-queue";
import { requirePermission } from "@/lib/auth/dal.server";
import { getValidationQueue, getValidationSummary, readValidationFilters } from "@/lib/validation.server";

export default async function ValidationRoutingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requirePermission("reports.view");
  const filters = readValidationFilters(await searchParams);
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
