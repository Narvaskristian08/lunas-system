import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketingSite } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: {
    default: "LUNAS | Infrastructure Reporting and Maintenance",
    template: "%s | LUNAS",
  },
  description:
    "Explore LUNAS, an AI-assisted academic prototype for infrastructure reporting, coordination, maintenance tracking, and SLA monitoring in Dagupan City.",
  openGraph: {
    type: "website",
    title: "LUNAS | Infrastructure Reporting and Maintenance",
    description:
      "An academic prototype exploring connected infrastructure reporting and maintenance coordination in Dagupan City.",
  },
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingSite>{children}</MarketingSite>;
}
