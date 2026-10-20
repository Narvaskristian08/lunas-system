import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

test.describe("workspace redirects and operational layouts", () => {
  let server: Server;
  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
      const role = req.headers.authorization?.replace("Bearer ui-", "") ?? "admin";
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/auth/login") return send({ accessToken: "ui-admin", user: { role: "admin" } });
      if (path === "/auth/refresh") return send({ accessToken: "ui-admin", refreshToken: "rotated-refresh" });
      if (path === "/users/me") return send({ id: "507f191e810c19729de860a1", role, firstName: "Test", lastName: "Official", email: "official@example.test", isActive: true });
      if (path === "/notifications") return send([]);
      if (path === "/users/authorized") return send({ accounts: [{ id: "507f191e810c19729de860a2", role: "barangay_official", firstName: "Ana", lastName: "Santos", email: "ana@example.test", accountStatus: "active", organization: "Barangay Pantal", version: 0 }], pagination: { page: 1, pages: 1, total: 1 }, roles: ["barangay_official"], barangays: ["Pantal"] });
      if (path === "/stats/barangay-reports") return send([{ barangay: "Pantal", reports: 4, unresolved: 3 }]);
      if (path === "/stats/validation-summary") return send({ pending: 3, validated: 1 });
      if (path === "/dashboard/work-orders-summary") return send({ awaitingFinalVerification: 2, overdue: 1 });
      if (/^\/incidents\/[a-f\d]{24}$/i.test(path)) return send({ _id: path.split("/").at(-1), workOrder: { _id: "507f191e810c19729de860a3" } });
      if (/^\/work-orders\/[a-f\d]{24}$/i.test(path)) return send({ _id: path.split("/").at(-1), orderNumber: "WO-202610-001", status: "provider_accepted", priority: "high" });
      if (path.startsWith("/work-orders")) return send({ workOrders: [{ _id: "507f191e810c19729de860a3", orderNumber: "WO-202610-001", status: "provider_accepted", priority: "high", sla: { state: "overdue", deadline: "2026-10-13T00:00:00Z", isOverdue: true }, incident: { _id: "507f191e810c19729de860a4", reportNumber: "LUNAS-202610-001", category: "water", location: { address: { barangay: "Pantal", city: "Dagupan City" } } } }], pagination: { page: 1, pages: 1, total: 1, limit: 20 } });
      if (path === "/categories") return send([]);
      if (path === "/incidents/pending-validation") {
        const query = new URL(req.url!, "http://localhost").searchParams;
        const currentPage = Number(query.get("page") ?? 1);
        const limit = Number(query.get("limit") ?? 5);
        const reports = Array.from({ length: 11 }, (_, index) => ({
          _id: (index + 1).toString(16).padStart(24, "0"),
          reportNumber: `REVIEW-${index + 1}`,
          category: "road_damage", status: "submitted",
          location: { address: { barangay: "Pantal", city: "Dagupan City" } },
        }));
        return res.end(JSON.stringify({ success: true, data: reports.slice((currentPage - 1) * limit, currentPage * limit), pagination: { page: currentPage, limit, total: reports.length, pages: Math.ceil(reports.length / limit) } }));
      }
      if (path === "/reporting-appeals") return send([]);
      return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });

  test("Secretary dashboard paginates all review reports and bounds invalid pages", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-barangay_official" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/dashboard");
    const pagination = page.getByRole("navigation", { name: "Reports awaiting review pagination" });
    await expect(pagination.getByText("Page 1 of 3")).toBeVisible();
    await expect(pagination.getByRole("button", { name: "Previous" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "REVIEW-1", exact: false })).toHaveCount(1);
    await pagination.getByRole("link", { name: "Next" }).click();
    await expect(pagination.getByText("Page 2 of 3")).toBeVisible();
    await expect(page.getByRole("link", { name: /^REVIEW-6/ })).toBeVisible();
    await pagination.getByRole("link", { name: "Next" }).click();
    await expect(pagination.getByText("Page 3 of 3")).toBeVisible();
    await expect(pagination.getByRole("button", { name: "Next" })).toBeDisabled();
    await pagination.getByRole("link", { name: "Previous" }).click();
    await expect(pagination.getByText("Page 2 of 3")).toBeVisible();
    await page.goto("/dashboard?reviewPage=999");
    await expect(pagination.getByText("Page 3 of 3")).toBeVisible();
    await page.goto("/dashboard?reviewPage=-1");
    await expect(pagination.getByText("Page 1 of 3")).toBeVisible();
  });

  test("successful Admin sign-in lands at the canonical accounts URL", async ({ page }) => {
    await page.route("https://challenges.cloudflare.com/turnstile/**", route => route.fulfill({ contentType: "application/javascript", body: `window.turnstile = { render(element, options) { this.verify = () => options.callback('test-captcha'); setTimeout(this.verify, 0); return 'test-widget'; }, reset() { setTimeout(this.verify, 0); } };` }));
    await page.goto("/login");
    await page.locator('input[type="email"]:visible').fill("admin@example.test");
    await page.locator('input[type="password"]:visible').fill("TestPassword2026!");
    await page.getByRole("button", { name: "Sign in to command center" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Authorized Accounts", exact: true })).toBeVisible();
  });

  test("access-token rotation persists its new cookie across a redirect", async ({ page, context, baseURL }) => {
    const expiredToken = `header.${Buffer.from(JSON.stringify({ exp: 1 })).toString("base64url")}.signature`;
    const previous = createSessionValue({ accessToken: expiredToken, refreshToken: "test-refresh" });
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: previous, url: baseURL!, httpOnly: true }]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/admin\/users$/);
    const cookie = (await context.cookies()).find(cookie => cookie.name === SESSION_COOKIE_NAME);
    expect(cookie?.value).toBeTruthy();
    expect(cookie!.value).not.toBe(previous);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Authorized Accounts", exact: true })).toBeVisible();
  });

  for (const role of ["admin", "barangay_official", "utility_provider"]) {
    test(`${role} landing, alias and restricted routes redirect without client errors`, async ({ page, context, baseURL }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: `ui-${role}` }), url: baseURL!, httpOnly: true }]);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(role === "admin" ? /\/admin\/users$/ : /\/dashboard$/);
      await page.goto("/incidents?search=water");
      await expect(page).toHaveURL(role === "admin" || role === "utility_provider" ? /\/unauthorized$/ : role === "city_engineer" ? /\/work-orders\?.*view=review/ : /\/validation-routing\?search=water/);
      if (role !== "admin") {
        await page.goto("/admin/users");
        await expect(page).toHaveURL(/\/unauthorized$/);
        await expect(page.getByRole("heading", { name: "This area is not available to your account" })).toBeVisible();
      }
      await expect(page.getByText("This page couldn’t load", { exact: true })).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  test("retired City Engineer cannot enter the dashboard", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-city_engineer" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Session expired", exact: true })).toBeVisible();
  });

  test("an intake incident with an existing work order opens that order", async ({ page, context, baseURL }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-utility_provider" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/work-orders/intake/507f191e810c19729de860a4");
    await expect(page).toHaveURL(/\/work-orders\/507f191e810c19729de860a3$/);
    await expect(page.getByRole("heading", { name: "WO-202610-001", exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("phone work orders and accounts expose status and actions in cards", async ({ page, context, baseURL }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-utility_provider" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/work-orders");
    await expect(page.getByRole("heading", { name: "Agency Reports", exact: true, level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-admin" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/admin/users");
    const accounts = page.getByRole("list", { name: "Authorized personnel" });
    await expect(accounts.getByText("Active", { exact: true })).toBeVisible();
    await expect(accounts.getByRole("button", { name: "View", exact: true })).toBeVisible();
  });
});
