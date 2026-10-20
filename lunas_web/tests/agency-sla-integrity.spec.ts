import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

let server: Server;
let stage = "pending_procurement";
let submitted: Record<string, unknown>;
const id = "507f191e810c19729de860a1";
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
    if (path === "/users/me") return send({ id, firstName: "Test", lastName: "Provider", email: "provider@example.test", role: "utility_provider", utilityCompany: "Agency", isActive: true });
    if (path === "/notifications") return send([]);
    if (path.endsWith("/agency-status")) {
      let body = ""; for await (const chunk of req) body += chunk;
      submitted = JSON.parse(body);
      res.statusCode = 409;
      return res.end(JSON.stringify({ success: false, message: "SLA record changed; original state retained" }));
    }
    if (path === `/incidents/${id}`) return send({ _id: id, reportNumber: "SLA-UI-1", category: "road", priority: "high", status: "in_progress", agencyStatus: stage,
      location: { coordinates: [120.3, 16.1], address: { barangay: "Pantal", city: "Dagupan City" } }, images: [],
      sla: { startedAt: "2026-10-01T00:00:00Z", deadline: "2026-10-04T00:00:45Z", state: "overdue", targetResolutionTime: 72 } });
    res.statusCode = 404; return send({});
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ context, baseURL }) => {
  submitted = {};
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-provider" }), url: baseURL!, httpOnly: true }]);
});
test("priority amendments are unavailable while authority is unresolved", async ({ page }) => {
  stage = "ready_for_work";
  await page.goto(`/work-orders/intake/${id}`);
  await expect(page.locator("#main-content").getByLabel("Agency priority")).toBeDisabled();
  await expect(page.locator("#main-content").getByText("Existing priority is preserved. Assignment or amendment requires approved authorization.")).toBeVisible();
});
test("status updates omit SLA values and a denied response retains the displayed step", async ({ page }) => {
  stage = "pending_procurement";
  await page.goto(`/work-orders/intake/${id}`);
  await expect(page.locator('input[type="datetime-local"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Continue to Next Step" }).click();
  await page.getByRole("button", { name: "Confirm Status", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "SLA record changed; original state retained" })).toBeVisible();
  expect(submitted).toEqual({ status: "work_in_progress", note: "" });
  await expect(page.locator("#main-content").getByText("Current step: Pending procurement / bidding")).toBeVisible();
});
