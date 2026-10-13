import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

test.describe("location integrity review with isolated API fixtures", () => {
  let server: Server;
  let finding = "";
  let version = 0;
  let history: unknown[] = [];
  test.beforeAll(async () => {
    server = createServer(async (req, res) => {
      const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/notifications") return send([]);
      if (path === "/users/me") return send({ id: "official", role: req.headers.authorization?.includes("citizen") ? "citizen" : req.headers.authorization?.includes("engineer") ? "city_engineer" : "barangay_official", firstName: "Ana", lastName: "Reviewer", email: "reviewer@example.test", barangay: "Pantal", isActive: true });
      if (path.endsWith("/false-report-review")) {
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const input = JSON.parse(Buffer.concat(chunks).toString());
          finding = input.finding; version++;
          history.push({ finding, reason: input.reason, evidenceReference: input.evidenceReference, reviewedAt: "2026-10-02T00:00:00Z" });
        }
        return send({ review: finding ? { finding, version, history } : null, confirmedFindingsInScope: finding === "confirmed_fabrication" ? 1 : 0 });
      }
      if (/^\/incidents\/[^/]+$/.test(path)) {
        const comparison = path.endsWith("/matching") ? "consistent" : path.endsWith("/manual") ? "unavailable" : "discrepancy";
        return send({ _id: path.split("/").pop(), reportNumber: "LUNAS-LOCATION-TEST", category: "road", status: "rejected", description: "A road damage report submitted from home.",
          location: { coordinates: [120.3333, 16.0433], address: { barangay: "Pantal", city: "Dagupan City" } }, images: [],
          locationIntegrity: { comparison, pinSource: "map_pin", confirmedAt: "2026-10-02T00:00:00Z", explanation: comparison === "discrepancy" ? { reason: "photo_taken_earlier", text: "Submitted later from home." } : undefined } });
      }
      if (path.endsWith("/history") || path.endsWith("/duplicate-candidates")) return send([]);
      return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
  test.beforeEach(async ({ context, baseURL }) => {
    finding = ""; version = 0; history = [];
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-official" }), url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
  });
  test("neutral discrepancy and explanation are visible; documented finding can be corrected", async ({ page, context, baseURL }) => {
    await page.goto("/validation-routing/home");
    await expect(page.locator("#main-content").getByText("Location Differs from Current GPS — Verification Required")).toBeVisible();
    await expect(page.locator("#main-content").getByText(/Citizen Explanation: Photo Taken Earlier/)).toBeVisible();
    await expect(page.locator("#main-content").getByText(/geographic jurisdiction is unverified/)).toBeVisible();
    const count = page.locator("dt:visible").filter({ hasText: "Active documented findings" }).locator("..").locator("dd");
    await expect(count).toHaveText(/0\s*\/\s*3/);
    await page.getByRole("button", { name: "Document Finding", exact: true }).click();
    const record = page.getByRole("dialog", { name: "Document False-Report Finding", exact: true });
    await record.getByLabel("Evidence Supporting Deliberate Fabrication").fill("Inspection and documented evidence support this reviewed finding.");
    await record.getByLabel("Evidence or Documented Decision Reference").fill("Inspection 123");
    await record.getByRole("button", { name: "Continue to Record Finding" }).click();
    await record.getByRole("button", { name: "Confirm Reviewed Decision" }).click();
    await expect(count).toHaveText(/1\s*\/\s*3/);
    // Barangay documents the initial finding; City Engineering corrects it.
    await expect(page.getByRole("button", { name: "Correct Finding", exact: true })).toHaveCount(0);
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-engineer" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/validation-routing/home");
    await page.getByRole("button", { name: "Correct Finding", exact: true }).click();
    const correction = page.getByRole("dialog", { name: "Correct False-Report Finding", exact: true });
    await correction.getByLabel("Correction Reason").fill("The inspection record referenced the wrong site; this finding was erroneous.");
    await correction.getByLabel("Evidence or Documented Decision Reference").fill("Correction 124");
    await correction.getByRole("button", { name: "Continue to Correction" }).click();
    await correction.getByRole("button", { name: "Confirm Reviewed Decision" }).click();
    await expect(count).toHaveText(/0\s*\/\s*3/);
    await page.getByText("View review history (2)", { exact: true }).click();
    await expect(page.locator("#main-content").getByText(/^Finding Corrected ·/)).toBeVisible();
    await expect(page.locator("#main-content").getByText("Inspection 123", { exact: false })).toBeVisible();
  });
  test("matching and missing GPS use neutral labels", async ({ page }) => {
    await page.goto("/validation-routing/matching");
    await expect(page.locator("#main-content").getByText("No Significant Discrepancy Detected")).toBeVisible();
    await page.goto("/validation-routing/manual");
    await expect(page.locator("#main-content").getByText("Comparison Unavailable", { exact: true })).toBeVisible();
  });
  test("citizen cannot open the official review interface", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-citizen" }), url: baseURL! }]);
    await page.goto("/validation-routing/home");
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.getByRole("button", { name: "Document Finding", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Correct Finding", exact: true })).toHaveCount(0);
  });
});
