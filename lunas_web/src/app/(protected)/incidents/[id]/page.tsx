import { redirect } from "next/navigation";

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/validation-routing/${encodeURIComponent(id)}`);
}
