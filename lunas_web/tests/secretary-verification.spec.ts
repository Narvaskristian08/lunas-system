import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

let server: Server;
let assigned = false;
let legacyState: string | undefined;
let mutation: Record<string, unknown> = {};
const incidentId = "507f191e810c19729de860a1";
const inspectionId = "507f191e810c19729de860a2";
const tanodId = "507f191e810c19729de860a3";
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
    if (path === "/users/me") return send({ id: "secretary", firstName: "Test", lastName: "Secretary", email: "secretary@example.test", role: "barangay_official", barangay: "Pantal", isActive: true });
    if (req.method === "POST" && (path.endsWith("/reassign") || path.endsWith("/review"))) {
      let body = ""; for await (const chunk of req) body += chunk;
      mutation = JSON.parse(body);
      res.statusCode = 409;
      return res.end(JSON.stringify({ success: false, message: "Inspection changed; refresh before continuing" }));
    }
    if (path === `/incidents/${incidentId}`) return send({ _id: incidentId, reportNumber: "VERIFICATION-TEST", category: "road", originalCategory: "road", status: legacyState ?? (assigned ? "tanod_assigned" : "tanod_verified"), agencyStatus: legacyState === "provider_assigned" ? "work_completed" : undefined, completionInspection: legacyState === "provider_assigned" ? { id: inspectionId, status: "submitted", result: "verified", findings: "Completion observations" } : undefined, jurisdiction: { barangay: "Pantal" }, location: { coordinates: [120.3, 16.1], address: { barangay: "Pantal", city: "Dagupan City" } }, images: [], initialInspection: { id: inspectionId, version: 3, status: assigned ? "assigned" : "submitted", findings: "Physical observations", result: "not_verified", acknowledgedAt: assigned ? "2026-10-20T00:00:00Z" : undefined, evidence: [] } });
    if (path === "/incidents/agency-exceptions") return send({ incidents: [{ id: incidentId, reportNumber: "ROUTING-TEST", category: "road", barangay: "Pantal", description: "Road asset ownership unknown", reason: "unknown_ownership", candidates: [], history: [] }] });
    if (path === "/incidents/tanod-personnel") return send([{ id: tanodId, firstName: "Replacement", lastName: "Tanod", barangay: "Pantal" }]);
    return send([]);
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ context, baseURL }) => {
  mutation = {}; legacyState = undefined;
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-secretary" }), url: baseURL!, httpOnly: true }]);
});
test("unverified findings cannot approve and clarification sends recipient and current version", async ({ page }) => {
  assigned = false;
  await page.goto(`/validation-routing/${incidentId}`);
  await page.getByRole("checkbox", { name: /I confirm the current category/ }).check();
  await expect(page.getByRole("button", { name: "Approve Verification", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "Decision reason", exact: true }).fill("Confirm the side of the street");
  await page.locator("#main-content").getByLabel("Clarification recipient").selectOption("citizen");
  await page.getByRole("button", { name: "Request Clarification", exact: true }).click();
  await expect(page.getByText("Inspection changed; refresh before continuing")).toBeVisible();
  expect(mutation).toMatchObject({ decision: "clarification", recipient: "citizen", expectedVersion: 3 });
});
test("reassignment requires a reason and sends the displayed task version", async ({ page }) => {
  assigned = true;
  await page.goto(`/validation-routing/${incidentId}`);
  const button = page.getByRole("button", { name: "Reassign Inspection", exact: true });
  await expect(button).toBeDisabled();
  await page.locator("#main-content").getByLabel("Replacement Tanod").selectOption(tanodId);
  await page.locator("#main-content").getByLabel("Reassignment reason").fill("Assigned Tanod is unavailable");
  await button.click();
  await expect(page.getByText("Inspection changed; refresh before continuing")).toBeVisible();
  expect(mutation).toMatchObject({ tanodId, expectedVersion: 3, reason: "Assigned Tanod is unavailable" });
});

test("routing exceptions show approved pending cases without jurisdiction override", async ({ page }) => {
  await page.goto("/validation-routing/exceptions");
  await expect(page.getByRole("heading", { name: "Agency routing exceptions" })).toBeVisible();
  await expect(page.getByRole("link", { name: "ROUTING-TEST" })).toBeVisible();
  await expect(page.locator("#main-content").getByText("Routing review: unknown ownership")).toBeVisible();
  await expect(page.locator("#main-content").getByText("Resolution and transfer authority: policy pending. No override is available.")).toBeVisible();
});

test("historical routing does not offer manual agency or legacy approval actions", async ({ page }) => {
  legacyState = "barangay_validated";
  await page.goto(`/validation-routing/${incidentId}`);
  const main = page.locator("#main-content");
  await expect(main.getByText("Historical routing requires reconciliation. Manual routing and SLA authority remain pending.")).toBeVisible();
  await expect(main.getByText("Category is wrong", { exact: false })).toHaveCount(0);
  await expect(main.getByRole("button", { name: "Validate and Forward" })).toHaveCount(0);
  expect(mutation).toEqual({});
});
test("completion findings retain correction but cannot offer policy-blocked closure", async ({ page }) => {
  legacyState = "provider_assigned";
  await page.goto(`/validation-routing/${incidentId}`);
  const main = page.locator("#main-content");
  await expect(main.getByText("Completion findings are recorded. Final closure authority is pending.")).toBeVisible();
  await expect(main.getByRole("button", { name: "Request Correction", exact: true })).toBeVisible();
  await expect(main.getByRole("button", { name: "Finalize and Complete" })).toHaveCount(0);
  expect(mutation).toEqual({});
});
