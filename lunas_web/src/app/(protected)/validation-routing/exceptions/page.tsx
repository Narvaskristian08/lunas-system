import Link from "next/link";
import { backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

type RoutingCase = { responsibleOrganization?: string; id: string; reportNumber: string; category: string; barangay: string; description: string; approvedAt?: string; reason: string; candidates: { ruleId: string; version: number; agencyId: string; organization: string }[]; history: { fromOrganization?: string; toOrganization?: string; reason?: string; routedAt?: string }[] };

export default async function AgencyExceptionsPage() {
  await requirePermission("reports.validate");
  const response = await backendRequest<{ data?: { incidents: RoutingCase[] } }>("/incidents/agency-exceptions", { accessToken: await requireAccessToken() });
  const data = responseData(response) as { incidents: RoutingCase[] };
  return <main className="space-y-6 p-6">
    <h1 className="text-2xl font-semibold">Agency routing exceptions</h1>
    <p>Approved reports awaiting a verified responsible agency. Jurisdiction decisions and transfers remain pending approved authority.</p>
    {!data.incidents.length && <p>No approved routing exceptions in your barangay.</p>}
    {data.incidents.map(item => <article key={item.id} className="space-y-2 rounded-lg border p-4">
      <h2 className="font-semibold"><Link href={`/validation-routing/${encodeURIComponent(item.id)}`}>{item.reportNumber}</Link></h2>
      <p>{item.category} · {item.barangay}</p><p>{item.description}</p>
      <p>Secretary approval: {item.approvedAt ? new Date(item.approvedAt).toLocaleString("en-PH") : "Not recorded"}</p>
      <p>Routing review: {item.reason.replaceAll("_", " ")}</p>
      <p>Responsible agency: {item.responsibleOrganization || "awaiting verified assignment"}</p>
      <ul>{item.candidates.map((candidate, index) => <li key={`${candidate.ruleId}:${index}`}>{candidate.organization} · {candidate.agencyId} · rule {candidate.ruleId} v{candidate.version}</li>)}</ul>
      <details><summary>Routing history</summary><ul>{item.history.map((entry, index) => <li key={index}>{entry.fromOrganization || "Unassigned"} → {entry.toOrganization || "Pending"}: {entry.reason}</li>)}</ul></details>
      <p>Resolution and transfer authority: policy pending. No override is available.</p>
    </article>)}
  </main>;
}
