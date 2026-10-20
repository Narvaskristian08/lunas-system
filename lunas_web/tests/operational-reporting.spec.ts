import { createServer, type Server } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";
const requireBackend = createRequire(path.join(process.cwd(), "package.json"));
const { aggregate } = requireBackend("../lunas_backend/node_modules/mingo");
const Incident = requireBackend("../lunas_backend/src/models/Incident");
const { getOperationalReport } = requireBackend("../lunas_backend/src/services/operationalReportService");
const { csvReport, pdfReport } = requireBackend("../lunas_backend/src/services/reportExportService");
let server: Server;
let allowExport = true;
const id = "507f191e810c19729de860a1";
const now = new Date("2026-10-20T02:00:00Z");
const rows = Array.from({ length: 237 }, (_, i) => ({ _id: String(i).padStart(24, "0"), reportNumber: `REPORT-${i}`, category: i < 120 ? "road" : "water", status: "submitted", createdAt: new Date("2026-10-20T00:00:00Z"), jurisdiction: { barangay: "Pantal" }, routing: { responsibleOrganization: i === 0 ? "=FORMULA()" : "Agency A" } }));
test.beforeAll(async () => {
  Incident.aggregate = (pipeline: unknown[]) => ({ option: async () => aggregate(rows, pipeline, { collectionResolver: () => [] }) });
  server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://localhost"); const pathname = url.pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    if (pathname === "/users/me") return res.end(JSON.stringify({ success: true, data: { id, firstName: "Secretary", lastName: "Fixture", email: "secretary@example.test", role: "barangay_official", barangay: "Pantal", isActive: true } }));
    if (pathname.startsWith("/operational-reports")) {
      const format = pathname.endsWith("/csv") ? "csv" : pathname.endsWith("/pdf") ? "pdf" : undefined;
      process.env.OPERATIONAL_REPORT_CSV_ROLES = allowExport ? "barangay_official" : ""; process.env.OPERATIONAL_REPORT_PDF_ROLES = allowExport ? "barangay_official" : "";
      try {
        const report = await getOperationalReport({ _id: id, role: "barangay_official", barangay: "Pantal", isActive: true }, Object.fromEntries(url.searchParams), format, now);
        if (format) { res.setHeader("Content-Type", format === "csv" ? "text/csv; charset=utf-8" : "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename="report.${format}"`); return res.end(format === "csv" ? csvReport(report) : await pdfReport(report)); }
        return res.end(JSON.stringify({ success: true, data: report }));
      } catch (error) { const failure = error as { statusCode?: number; message: string }; res.statusCode = failure.statusCode || 500; return res.end(JSON.stringify({ message: failure.message })); }
    }
    return res.end(JSON.stringify({ success: true, data: [] }));
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ context, baseURL }) => {
  allowExport = true;
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "test-reporting" }), url: baseURL!, httpOnly: true }]);
});
test("full totals and stable pagination exceed the previous 100-row cap", async ({ page }) => {
  await page.goto("/validation-routing/reports?period=daily&date=2026-10-20&limit=100");
  await expect(page.getByRole("table")).toContainText("237 matching incidents; page 1 of 3");
  await expect(page.getByRole("row")).toHaveCount(101);
  await page.getByRole("link", { name: "Next page" }).click();
  await expect(page.getByRole("table")).toContainText("page 2 of 3");
  await page.getByRole("link", { name: "Next page" }).click();
  await expect(page.getByRole("row")).toHaveCount(38);
  await expect(page.getByRole("link", { name: "REPORT-0", exact: true })).toBeVisible();
});
test("combined filters are applied before totals and pagination", async ({ page }) => {
  await page.goto("/validation-routing/reports?period=daily&date=2026-10-20");
  await page.locator("#main-content").getByLabel("category", { exact: true }).selectOption("water");
  await page.locator("#main-content").getByLabel("barangay", { exact: true }).fill("Pantal");
  await page.locator("#main-content").getByRole("button", { name: "Apply report filters" }).click();
  await expect(page.getByRole("table")).toContainText("117 matching incidents");
  await expect(page.getByRole("region", { name: "Full result summary" })).toContainText("117");
});
test("CSV and real PDF downloads cover all filtered incidents", async ({ page }) => {
  await page.goto("/validation-routing/reports?period=daily&date=2026-10-20");
  const csvDownload = page.waitForEvent("download"); await page.getByRole("link", { name: "Download CSV" }).click();
  const csv = await readFile((await (await csvDownload).path())!, "utf8");
  expect(csv.match(/"Incident",/g)).toHaveLength(237); expect(csv).toContain("'=FORMULA()");
  const pdfDownload = page.waitForEvent("download"); await page.getByRole("link", { name: "Download PDF" }).click();
  const pdf = await readFile((await (await pdfDownload).path())!);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-"); expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)!.length).toBeGreaterThan(1);
});
test("view access does not grant export and tampered scope is denied", async ({ page }) => {
  allowExport = false;
  await page.goto("/validation-routing/reports?date=2026-10-20");
  await expect(page.locator("#main-content").getByText("CSV export: policy pending")).toBeVisible();
  const blocked = await page.request.get("/validation-routing/reports/export?format=csv&date=2026-10-20"); expect(blocked.status()).toBe(403);
  await page.goto("/validation-routing/reports?barangay=Bolosan&date=2026-10-20");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText("outside your reporting scope");
});
