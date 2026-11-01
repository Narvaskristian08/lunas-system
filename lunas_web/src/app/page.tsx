import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";
import { MarketingSite } from "@/components/marketing/marketing-site";

export const metadata: Metadata = {
  title: {
    absolute: "LUNAS | Smarter Reporting. Better Coordination. Stronger Communities.",
  },
  description:
    "LUNAS is an AI-assisted academic prototype for citizen infrastructure reporting, local coordination, maintenance tracking, and incident updates in Dagupan City.",
  openGraph: {
    type: "website",
    title: "LUNAS | Smarter Reporting. Better Coordination. Stronger Communities.",
    description:
      "An academic prototype exploring connected infrastructure reporting and maintenance coordination in Dagupan City.",
  },
  robots: { index: true, follow: true },
};

export default function Home() {
  return (
    <MarketingSite>
      <HomePage />
    </MarketingSite>
  );
}
