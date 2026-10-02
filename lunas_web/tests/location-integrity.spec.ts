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
      if (path === "/users/me") return send({ id: "official", role: req.headers.authorization?.includes("citizen") ? "citizen" : "barangay_official", firstName: "Ana", lastName: "Reviewer", email: "reviewer@example.test", barangay: "Pantal", isActive: true });
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
  test("neutral discrepancy and explanation are visible; documented finding can be corrected", async ({ page }) => {
    await page.goto("/validation-routing/home");
    await expect(page.locator("#main-content").getByText("Location differs from current GPS - location requires verification")).toBeVisible();
    await expect(page.locator("#main-content").getByText(/Citizen explanation: Photo Taken Earlier/)).toBeVisible();
    await expect(page.locator("#main-content").getByText(/geographic jurisdiction is unverified/)).toBeVisible();
    await expect(page.locator("#main-content").getByText(/within your jurisdiction: 0/)).toBeVisible();
    await page.locator("#main-content").getByLabel("Evidence supporting deliberate fabrication").fill("Inspection and documented evidence support this reviewed finding.");
    await page.locator("#main-content").getByLabel("Evidence or documented decision reference").fill("Inspection 123");
    await page.locator("#main-content").getByRole("button", { name: "Record reviewed finding" }).click();
    await page.locator("#main-content").getByRole("button", { name: "Confirm reviewed decision" }).click();
    await expect(page.locator("#main-content").getByText(/within your jurisdiction: 1/)).toBeVisible();
    await page.locator("#main-content").getByLabel("Correction reason").fill("The inspection record referenced the wrong site; this finding was erroneous.");
    await page.locator("#main-content").getByLabel("Evidence or documented decision reference").fill("Correction 124");
    await page.locator("#main-content").getByRole("button", { name: "Correct erroneous finding" }).click();
    await page.locator("#main-content").getByRole("button", { name: "Confirm reviewed decision" }).click();
    await expect(page.locator("#main-content").getByText(/within your jurisdiction: 0/)).toBeVisible();
    await expect(page.locator("#main-content").getByText("Finding corrected", { exact: false })).toBeVisible();
    await expect(page.locator("#main-content").getByText("Inspection 123", { exact: false })).toBeVisible();
  });
  test("matching and missing GPS use neutral labels", async ({ page }) => {
    await page.goto("/validation-routing/matching");
    await expect(page.locator("#main-content").getByText("No significant discrepancy detected")).toBeVisible();
    await page.goto("/validation-routing/manual");
    await expect(page.locator("#main-content").getByText("Comparison unavailable", { exact: true })).toBeVisible();
  });
  test("citizen cannot open the official review interface", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-citizen" }), url: baseURL! }]);
    await page.goto("/validation-routing/home");
    await expect(page).toHaveURL(/\/unauthorized/);
    await expect(page.locator("#main-content").getByRole("button", { name: "Record reviewed finding" })).toHaveCount(0);
  });
});
