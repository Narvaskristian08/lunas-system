import { redirect } from "next/navigation";

export default async function SlaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/work-orders/${encodeURIComponent(id)}`);
}
