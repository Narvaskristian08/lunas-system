import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal.server";
import { getAgencyExceptions } from "@/lib/validation.server";

export default async function AgencyExceptionsPage() {
  await requirePermission("reports.validate");
  const { incidents } = await getAgencyExceptions();
  return <section className="space-y-4"><h1 className="text-2xl font-bold">Agency routing review</h1><p className="text-slate-600">Approved reports without a destination. Verify infrastructure ownership and jurisdiction before selecting a provisioned agency.</p>
    <div className="divide-y rounded-xl border bg-white">{incidents.length ? incidents.map(value => {
      const incident = value as { _id?: string; id?: string; reportNumber?: string; category?: string };
      const id = incident.id || incident._id;
      return id ? <Link key={id} href={`/validation-routing/${encodeURIComponent(id)}`} className="block p-4 font-semibold text-brand-700">{incident.reportNumber || "Report"} · {incident.category || "Unclassified"}</Link> : null;
    }) : <p className="p-4 text-slate-600">No reports are awaiting agency routing review.</p>}</div>
  </section>;
}
