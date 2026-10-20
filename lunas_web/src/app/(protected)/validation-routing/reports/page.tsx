import { OperationalReportPage } from "@/components/reports/operational-report";
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <OperationalReportPage params={await searchParams} role="barangay_official" />;
}
