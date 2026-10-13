import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

test.describe("engineering maintenance workspace", () => {
  let server: Server;
  const requested: string[] = [];
  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url!, "http://localhost");
      const path = url.pathname.replace("/api/v1", "");
      requested.push(url.pathname + url.search);
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/notifications") return send([]);
      if (path === "/users/me") return send({ id: "engineer", role: req.headers.authorization?.includes("provider") ? "utility_provider" : "city_engineer", firstName: "Test", lastName: "Engineer", email: "engineer@example.test", isActive: true, utilityCompany: "Water District" });
      if (path === "/dashboard/work-orders-summary") return send({ active: 2, awaitingFinalVerification: 1 });
      if (path === "/stats/validation-summary") return send({ pending: 3 });
      if (path === "/work-orders") return send({ workOrders: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } });
      if (path === "/incidents/pending-validation") return send({ incidents: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } });
      if (path === "/categories") return send([{ code: "road", name: "Roads and Sidewalks" }]);
      return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
  test.beforeEach(async ({ context, baseURL }) => {
    requested.length = 0;
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-engineer" }), url: baseURL!, httpOnly: true }]);
  });
  test("cards and tabs open separate review and verification queues", async ({ page }) => {
    await page.goto("/work-orders");
    await expect(page.getByRole("heading", { name: "Maintenance", exact: true })).toBeVisible();
    const sidebar = page.getByRole("navigation", { name: "Primary Navigation" });
    await expect(sidebar.getByRole("link", { name: "Maintenance", exact: true })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Pending Validation" })).toHaveCount(0);
    await page.getByRole("link", { name: "Awaiting Review 3", exact: true }).click();
    await expect(page).toHaveURL(/view=review/);
    await expect(page.getByRole("heading", { name: "Barangay-Validated Incident Queue" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Awaiting Review 3", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Awaiting Verification 1", exact: true }).click();
    await expect(page.getByRole("link", { name: "Awaiting Verification 1", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page).toHaveURL(/view=verification/);
    await expect.poll(() => requested.some(path => path.startsWith("/api/v1/work-orders?") && path.includes("status=provider_accepted"))).toBe(true);
    await expect(page.getByLabel("Repair Status", { exact: true })).toHaveCount(0);
    await page.goto("/validation-routing");
    await expect(page).toHaveURL(/work-orders\?view=review/);
  });
  test("provider navigation retains work orders and has no engineering tabs", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-provider" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/work-orders");
    await expect(page.getByRole("heading", { name: "Work Orders", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Maintenance views" })).toHaveCount(0);
  });
});
