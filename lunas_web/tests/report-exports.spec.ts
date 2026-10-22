import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { Workbook } from "exceljs";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";
import { reportRange } from "../src/lib/report-export";

test.describe("workspace report exports", () => {
  let server: Server;
  const requests: Array<{ token: string; page: number; from: string | null; to: string | null; timezone: string | null }> = [];
  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url!, "http://localhost");
      const path = url.pathname.replace("/api/v1", "");
      const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
      const role = token.includes("utility_provider") ? "utility_provider" : "barangay_official";
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/users/me") return send({ id: "507f191e810c19729de860a1", role, firstName: "Test", lastName: "Officer", email: "test@example.test", isActive: true, barangay: "Pantal", utilityCompany: "Test Water Agency" });
      if (path === "/notifications") return send([]);
      if (path === "/incidents") {
        const page = Number(url.searchParams.get("page"));
        const limit = Number(url.searchParams.get("limit"));
        requests.push({ token, page, from: url.searchParams.get("from"), to: url.searchParams.get("to"), timezone: url.searchParams.get("timezone") });
        if (token.includes("failure") && page === 2) { res.statusCode = 503; return res.end(JSON.stringify({ message: "Fixture service unavailable" })); }
        const reports = token.includes("empty") ? [] : Array.from({ length: 101 }, (_, index) => ({
          _id: String(index + 1).padStart(24, "0"), reportNumber: `${role === "utility_provider" ? "AGENCY" : "BARANGAY"}-${index + 1}`,
          category: "road", status: index === 0 ? "closed" : "submitted", agencyStatus: "work_in_progress",
          description: index === 0 ? '=HYPERLINK("https://example.test")' : index === 1 ? '<script>window.exportInjected=true</script> & "quoted"\nNext line' : `Report details ${index + 1}`,
          createdAt: "2026-10-21T00:00:00.000Z", location: { address: { street: "Sample Street", barangay: "Pantal", city: "Dagupan City" } },
        }));
        const total = token.includes("oversized") ? 10001 : reports.length;
        return res.end(JSON.stringify({ success: true, data: reports.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, pages: Math.ceil(total / limit) } }));
      }
      return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });

  for (const [role, basePath, prefix] of [
    ["barangay_official", "/validation-routing/reports", "BARANGAY"],
    ["utility_provider", "/work-orders/reports", "AGENCY"],
  ] as const) {
    test(`${role} exports complete scoped CSV, styled Excel and printable PDF layout`, async ({ page, context, baseURL }, testInfo) => {
      const token = `export-${role}`;
      await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: token }), url: baseURL!, httpOnly: true }]);
      await page.goto(`${basePath}?period=monthly`);
      await expect(page.getByRole("group", { name: "Export reports" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Excel", exact: true })).toHaveAttribute("href", `${basePath}/export?period=monthly&format=xlsx`);
      const csv = await context.request.get(`${basePath}/export?period=monthly&format=csv`);
      expect(csv.status()).toBe(200);
      expect(csv.headers()["cache-control"]).toContain("no-store");
      const csvText = await csv.text();
      expect(csvText).toContain(`${prefix}-101`);
      expect(csvText).toContain("'=HYPERLINK");
      expect(csvText).not.toContain(prefix === "AGENCY" ? "BARANGAY-" : "AGENCY-");
      const excel = await context.request.get(`${basePath}/export?period=monthly&format=xlsx`);
      expect(excel.status()).toBe(200);
      expect(excel.headers()["content-type"]).toContain("spreadsheetml.sheet");
      const workbook = new Workbook();
      await workbook.xlsx.load(new Uint8Array(await excel.body()).buffer);
      const sheet = workbook.getWorksheet("Report register")!;
      expect(sheet.rowCount).toBe(108);
      expect(sheet.getCell("A108").value).toBe(`${prefix}-101`);
      expect(sheet.getRow(7).getCell(1).font.bold).toBe(true);
      expect(sheet.views[0].state).toBe("frozen");
      expect(sheet.autoFilter).toBeTruthy();
      const descriptionColumn = role === "utility_provider" ? 6 : 5;
      expect(sheet.getRow(8).getCell(descriptionColumn).type).toBe(3); // ExcelJS text, not formula.
      expect(workbook.getWorksheet("Summary")!.getCell("B5").value).toBe(101);
      expect(workbook.getWorksheet("Summary")!.getColumn(1).values).toContain("Road Damage");
      await page.goto(`${basePath}/export?period=monthly&format=print`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(role === "utility_provider" ? "Agency Activity Report" : "Barangay Incident Report");
      await expect(page.getByRole("table", { name: "Incidents by category" }).getByRole("row", { name: "Road Damage 101", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: `${prefix}-101`, exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: /<script>window.exportInjected/ })).toBeVisible();
      expect(await page.evaluate(() => "exportInjected" in window)).toBe(false);
      await page.emulateMedia({ media: "print" });
      await expect(page.getByRole("button", { name: "Print / Save as PDF" })).toBeHidden();
      expect(await page.locator(".table-wrap thead").evaluate(element => getComputedStyle(element).display)).toBe("table-header-group");
      await page.pdf({ path: testInfo.outputPath(`${prefix.toLowerCase()}-report.pdf`), preferCSSPageSize: true, printBackground: true });
      await page.screenshot({ path: testInfo.outputPath(`${prefix.toLowerCase()}-print-preview.png`) });
      expect(requests.filter(request => request.token === token && request.page === 2).length).toBeGreaterThanOrEqual(4);
      expect(requests.filter(request => request.token === token).every(request => request.timezone === "Asia/Manila")).toBe(true);
      expect(requests.filter(request => request.token === token).every(request => request.from === reportRange("monthly").from && request.to === reportRange("monthly").to)).toBe(true);
    });
  }

  test("empty exports render honestly and incomplete or oversized exports never download partial data", async ({ page, context, baseURL }) => {
    for (const [suffix, expectedStatus] of [["failure", 503], ["oversized", 413], ["empty", 200]] as const) {
      await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: `export-barangay_official-${suffix}` }), url: baseURL!, httpOnly: true }]);
      const response = await context.request.get("/validation-routing/reports/export?format=csv&period=daily");
      expect(response.status()).toBe(expectedStatus);
      if (expectedStatus !== 200) expect(response.headers()["content-disposition"]).toBeUndefined();
    }
    await page.goto("/validation-routing/reports/export?format=print&period=daily");
    await expect(page.getByRole("cell", { name: "No reports matched this reporting period." })).toBeVisible();
  });

  test("historical calendar month selection reaches every export request", async ({ context, baseURL }) => {
    const token = "export-barangay_official-historical";
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: token }), url: baseURL!, httpOnly: true }]);
    const response = await context.request.get("/validation-routing/reports/export?format=csv&period=monthly&date=2024-02-18");
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('"2024-02-01","2024-02-29"');
    const matching = requests.filter(request => request.token === token);
    expect(matching.length).toBe(2);
    expect(matching.every(request => request.from === "2024-02-01" && request.to === "2024-02-29" && request.timezone === "Asia/Manila")).toBe(true);
  });

  test("export formats preserve workspace access restrictions", async ({ context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "export-utility_provider" }), url: baseURL!, httpOnly: true }]);
    const denied = await context.request.get("/validation-routing/reports/export?format=xlsx");
    expect(denied.url()).toContain("/unauthorized");
    const invalid = await context.request.get("/work-orders/reports/export?format=exe");
    expect(invalid.status()).toBe(400);
  });
});
