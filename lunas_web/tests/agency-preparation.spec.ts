import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

let server: Server;
let state: "incoming" | "acknowledged" | "external" = "incoming";
let denied = false;
let submitted: Record<string, unknown> = {};
const id = "507f191e810c19729de860a1";
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
    if (path === "/users/me") return send({ id, firstName: "Agency", lastName: "Officer", role: "utility_provider", utilityCompany: "Test agency", email: "agency@example.test", isActive: true });
    if (path.endsWith("/agency-preparation")) {
      let body = ""; for await (const chunk of req) body += chunk;
      submitted = JSON.parse(body);
      if (denied) { res.statusCode = 409; return res.end(JSON.stringify({ success: false, message: "Agency record changed; refresh before continuing" })); }
      state = submitted.operation === "acknowledge" ? "acknowledged" : "external";
      return send({});
    }
    if (path === `/incidents/${id}`) return send({ _id: id, reportNumber: "PREPARATION-TEST", status: "provider_assigned", category: "road", description: "Test damage", agencyStatus: state === "incoming" ? "not_routed" : state === "external" ? "pending_external_processing" : "acknowledged",
      routing: { responsibleOrganization: "Test agency" }, location: { address: { barangay: "Pantal", city: "Dagupan City" }, coordinates: [120.3, 16.1] }, images: [], sla: {},
      agencyPreparation: state === "incoming" ? undefined : { revision: state === "external" ? 2 : 1, organization: "Test agency", acknowledgedAt: "2026-10-20T00:00:00Z", outcome: state === "external" ? "external" : undefined, milestone: state === "external" ? "pending_external_processing" : undefined, history: [] } });
    return send([]);
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ context, baseURL }) => {
  state = "incoming"; denied = false; submitted = {};
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "test-agency" }), url: baseURL!, httpOnly: true }]);
});
test("agency receipt is explicit and work authorization stays disabled", async ({ page }) => {
  await page.goto(`/work-orders/intake/${id}`);
  await expect(page.getByRole("button", { name: "Authorize work — policy pending" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Ready for maintenance — policy pending" })).toBeDisabled();
  await page.getByRole("button", { name: "Acknowledge agency receipt" }).click();
  await expect(page.getByRole("button", { name: "Record assessment" })).toBeVisible();
  expect(submitted).toEqual({ operation: "acknowledge", expectedVersion: 0 });
  await expect(page.getByRole("combobox", { name: "Assessment outcome" })).toHaveValue("routine");
  await expect(page.getByRole("combobox", { name: "Next external milestone" })).toHaveCount(0);
});
test("external assessment requires its fields and records the current version", async ({ page }) => {
  state = "acknowledged";
  await page.goto(`/work-orders/intake/${id}`);
  const main = page.locator("#main-content");
  await main.getByLabel("Assessment outcome", { exact: true }).selectOption("external");
  await expect(page.getByRole("button", { name: "Record assessment" })).toBeDisabled();
  await main.getByLabel("Assessment notes / milestone remarks", { exact: true }).fill("Human assessment");
  await main.getByLabel("Maintenance requirements", { exact: true }).fill("Repair damaged surface");
  await main.getByLabel("Resource availability", { exact: true }).fill("Funding review required");
  await main.getByLabel("Recommended approach", { exact: true }).fill("Agency repair approach");
  await main.getByLabel("External process type", { exact: true }).fill("Outside funding approval");
  await page.getByRole("button", { name: "Record assessment" }).click();
  await expect(main.getByLabel("Next external milestone", { exact: true })).toBeVisible();
  expect(submitted).toMatchObject({ operation: "assess", expectedVersion: 1, outcome: "external", processType: "Outside funding approval" });
  expect(submitted).not.toHaveProperty("sla");
});
test("stale external milestone shows error and retains pending status", async ({ page }) => {
  state = "external"; denied = true;
  await page.goto(`/work-orders/intake/${id}`);
  const main = page.locator("#main-content");
  await main.getByLabel("Assessment notes / milestone remarks", { exact: true }).fill("Awaiting outside funding");
  await main.getByLabel("Next external milestone", { exact: true }).selectOption("pending_funding");
  await page.getByRole("button", { name: "Record external milestone" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Agency record changed; refresh before continuing" })).toBeVisible();
  await expect(main.getByText("Current milestone: pending external processing")).toBeVisible();
  expect(submitted).toMatchObject({ operation: "external", expectedVersion: 2, milestone: "pending_funding" });
});
