import { notFound } from "next/navigation";
import { ValidationReview } from "@/components/validation/validation-review";
import { ErrorState } from "@/components/states/system-state";
import { BackendApiError } from "@/lib/api/backend.server";
import { requirePermission } from "@/lib/auth/dal.server";
import { getValidationIncident, getTanodPersonnel, getUtilityProviderOrganizations } from "@/lib/validation.server";

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
  let incident;
  try {
    incident = await loadValidationIncident(id);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) notFound();
    return <ErrorState variant="data" />;
  }
  const needsLegacyRouting = ["barangay_validated", "city_confirmed", "prioritized"].includes(incident.status);
  const [utilityProviders, tanods] = await Promise.all([
    viewer.backendRole === "barangay_official" && needsLegacyRouting
      ? getUtilityProviderOrganizations().catch(() => [])
      : Promise.resolve([]),
    viewer.backendRole === "barangay_official"
      ? getTanodPersonnel().catch(() => [])
      : Promise.resolve([]),
  ]);
  return <ValidationReview viewer={viewer} incident={incident} utilityProviders={utilityProviders} tanods={tanods} />;
}
