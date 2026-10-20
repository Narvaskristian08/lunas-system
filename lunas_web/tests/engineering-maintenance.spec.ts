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
  test("retired City Engineer sessions cannot open operational queues", async ({ page }) => {
    await page.goto("/work-orders");
    await expect(page.getByRole("heading", { name: "Session expired", exact: true })).toBeVisible();
    expect(requested.some(path => path.startsWith("/api/v1/work-orders?"))).toBe(false);
  });
  test("provider navigation opens Agency Reports without retired engineering tabs", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-provider" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/work-orders");
    await expect(page.getByRole("heading", { name: "Agency Reports", exact: true, level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Maintenance views" })).toHaveCount(0);
  });
});
