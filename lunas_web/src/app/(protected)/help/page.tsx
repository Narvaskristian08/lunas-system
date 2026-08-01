import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { HelpCenter } from "@/components/support/help-center";
import { requirePermission } from "@/lib/auth/dal.server";
import { helpTopics } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Help and Support" };

export default async function HelpPage() {
  const viewer = await requirePermission("support.create");
  return (
    <>
      <PageHeader
        eyebrow="Shared services"
        title="Help and support"
        description="Find practical guidance for LUNAS workflows or send a secure technical-support request."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Help and support" }]}
      />
      <HelpCenter topics={helpTopics} contactEmail={viewer.email} />
    </>
  );
}
