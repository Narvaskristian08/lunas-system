import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

let server: Server;
let pending = false;
let completed = false;
let mutation: Record<string, unknown> = {};
const id = "507f191e810c19729de860a1";
const worker = "507f191e810c19729de860a2";
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    const send = (data: unknown, message?: string) => res.end(JSON.stringify({ success: true, data, message }));
    if (path === "/users/me") return send({ id, firstName: "Agency", lastName: "Officer", role: "utility_provider", utilityCompany: "Test agency", email: "agency@example.test", isActive: true });
    if (path === "/users/repair-personnel") {
      if (req.method === "POST") {
        let body = ""; for await (const chunk of req) body += chunk; mutation = JSON.parse(body);
        res.statusCode = 201; return send({ delivery: { delivered: false } }, "Repair Personnel account created; activation delivery pending.");
      }
      return send([{ id: worker, version: 2, firstName: "Existing", lastName: "Repair", email: "repair@example.test", phone: "09123456789", repairOrganization: "Test agency", repairAccountType: "individual", accountStatus: "active", isActive: true }]);
    }
    if (path.endsWith("/eligible-personnel")) return send([{ id: worker, firstName: "Replacement", lastName: "Repair", availability: "available", organization: "Test agency" }]);
    if (path.endsWith("/reassign")) {
      let body = ""; for await (const chunk of req) body += chunk; mutation = JSON.parse(body);
      res.statusCode = 409; return res.end(JSON.stringify({ success: false, message: "Work order changed; refresh before continuing" }));
    }
    if (path === `/work-orders/${id}`) return send({ id, version: 7, orderNumber: "REPAIR-HANDOFF-TEST", status: completed ? "completed" : "in_progress", assignmentState: pending ? "pending" : "accepted", responsibleOrganization: "Test agency", progressPercent: 50, progressStage: "main_repair", startedAt: "2026-10-01T00:00:00Z", assignedTo: { id: "old-worker", firstName: "Current", lastName: "Repair" }, currentAssignment: { id: "assignment", status: pending ? "pending" : "accepted", active: true }, sla: { deadline: "2026-10-30T00:00:00Z" }, incident: { id, reportNumber: "REPORT-TEST", category: "road", location: { coordinates: [120.3, 16.1], address: { barangay: "Pantal" } } }, assignments: [], progressUpdates: [], history: [] });
    return send([]);
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ context, baseURL }) => {
  mutation = {}; pending = false; completed = false;
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "test-agency" }), url: baseURL!, httpOnly: true }]);
});
test("staffing uses restored provider endpoints and reports pending activation delivery", async ({ page }) => {
  await page.goto("/repair-personnel");
  const main = page.locator("#main-content");
  await expect(main.getByRole("table").getByText("Existing Repair", { exact: true })).toBeVisible();
  await main.getByLabel("First Name *", { exact: true }).fill("New");
  await main.getByLabel("Last Name *", { exact: true }).fill("Repair");
  await main.getByLabel("Email *", { exact: true }).fill("new-repair@example.test");
  await main.getByLabel("Contact Number *", { exact: true }).fill("09123456789");
  await page.getByRole("button", { name: "Create Account and Send Invitation", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "activation delivery pending" })).toBeVisible();
  expect(mutation).toMatchObject({ firstName: "New", repairAccountType: "individual" });
  expect(mutation).not.toHaveProperty("repairOrganization"); expect(mutation).not.toHaveProperty("password");
});
test("in-progress reassignment sends version and reason and retains state on conflict", async ({ page }) => {
  await page.goto(`/work-orders/${id}`);
  const main = page.locator("#main-content");
  await main.getByRole("combobox").filter({ has: page.locator(`option[value="${worker}"]`) }).selectOption(worker);
  await main.getByLabel("Reassignment Reason", { exact: true }).fill("Crew unavailable; preserve existing work");
  await page.getByRole("button", { name: "Reassign Work Order", exact: true }).click();
  await page.getByRole("button", { name: "Reassign Personnel", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "This work order changed while you were viewing it." })).toBeVisible();
  expect(mutation).toMatchObject({ assigneeId: worker, version: 7, reason: "Crew unavailable; preserve existing work" });
  await expect(main.getByText("Recorded maintenance progress: 50%", { exact: true })).toBeVisible();
});
test("agency sees pending replacement acceptance without resetting the task", async ({ page }) => {
  pending = true;
  await page.goto(`/work-orders/${id}`);
  await expect(page.locator("#main-content").getByText("Pending reassignment acceptance.", { exact: true })).toBeVisible();
  await expect(page.locator("#main-content").getByText("Recorded maintenance progress: 50%", { exact: true })).toBeVisible();
});

test("completed historical work cannot offer provider closure while correction stays available", async ({ page }) => {
  completed = true;
  await page.goto(`/work-orders/${id}`);
  const main = page.locator("#main-content");
  await expect(main.getByRole("button", { name: "Verify and Resolve", exact: true })).toBeDisabled();
  await expect(main.getByRole("button", { name: "Return for Correction", exact: true })).toBeVisible();
  await expect(main.getByText("Completion is recorded. Final approval and closure authority remain pending; correction requests remain available.")).toBeVisible();
  expect(mutation).toEqual({});
});
