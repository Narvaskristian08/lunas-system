import { notFound } from "next/navigation";
import { ValidationReview } from "@/components/validation/validation-review";
import { BackendApiError } from "@/lib/api/backend.server";
import { requirePermission } from "@/lib/auth/dal.server";
import { getValidationIncident } from "@/lib/validation.server";

async function loadValidationIncident(id: string) {
  try {
    return await getValidationIncident(id);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function ValidationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requirePermission("reports.view");
  const { id } = await params;
  const incident = await loadValidationIncident(id);
  return <ValidationReview viewer={viewer} incident={incident} />;
}
