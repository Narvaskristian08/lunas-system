import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

test.describe("notification inbox state and responsive layout", () => {
  let server: Server;
  let items: Array<{ _id: string; type: string; title: string; message: string; createdAt: string; isRead: boolean; priority: string; data: { workOrderId: string } }>;
  let failList = false;
  let failRead = false;
  let delayRead = false;
  let releaseRead: (() => void) | undefined;
  test.beforeAll(async () => {
    server = createServer(async (req, res) => {
      const url = new URL(req.url!, "http://localhost");
      const path = url.pathname.replace("/api/v1", "");
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/users/me") return send({ id: "engineer", role: "utility_provider", utilityCompany: "Water District", firstName: "Test", lastName: "Engineer", email: "test@example.test", isActive: true });
      if (path === "/notifications" && req.method === "GET") {
        if (failList) { res.statusCode = 503; return res.end(JSON.stringify({ success: false, message: "Unavailable" })); }
        const filtered = items.filter(item => !url.searchParams.has("isRead") || String(item.isRead) === url.searchParams.get("isRead"));
        const page = Number(url.searchParams.get("page") || 1);
        const limit = Number(url.searchParams.get("limit") || 20);
        return res.end(JSON.stringify({ success: true, data: filtered.slice((page - 1) * limit, page * limit), pagination: { total: filtered.length, pages: Math.ceil(filtered.length / limit) }, unreadCount: items.filter(item => !item.isRead).length }));
      }
      if (req.method === "PUT" && path.startsWith("/notifications/")) {
        if (failRead) { res.statusCode = 503; return res.end(JSON.stringify({ success: false, message: "Unavailable" })); }
        if (delayRead) await new Promise<void>(resolve => { releaseRead = resolve; });
        if (path === "/notifications/read-all") items.forEach(item => { item.isRead = true; });
        else { const item = items.find(item => path === `/notifications/${item._id}/read`); if (item) item.isRead = true; }
        return send({});
      }
      if (path.startsWith("/notifications/")) return send(items.find(item => path === `/notifications/${item._id}`));
      res.statusCode = 404; return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
  test.beforeEach(async ({ context, baseURL }) => {
    failList = false; failRead = false; delayRead = false; releaseRead = undefined;
    items = Array.from({ length: 6 }, (_, index) => ({ _id: (index + 1).toString(16).padStart(24, "0"), type: "work_order_assigned", title: `Assignment ${index + 1}`, message: `Work order WO-202610-00${index + 1} needs attention.`, createdAt: "2026-10-14T00:00:00Z", isRead: false, priority: "high", data: { workOrderId: "a".repeat(24) } }));
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-engineer" }), url: baseURL!, httpOnly: true }]);
  });
  test.afterEach(() => releaseRead?.());

  test("a delayed bulk save refreshes the current filter instead of the old one", async ({ page }) => {
    await page.goto("/notifications");
    await page.getByRole("combobox", { name: "Read Status", exact: true }).selectOption("unread");
    await expect(page.getByText("6 unread notifications need your attention.")).toBeVisible();
    delayRead = true;
    await page.getByRole("button", { name: "Mark All as Read", exact: true }).click();
    await expect.poll(() => Boolean(releaseRead)).toBe(true);
    await page.getByRole("combobox", { name: "Read Status", exact: true }).selectOption("read");
    releaseRead!();
    await expect(page.getByText("You’re caught up. New operational alerts will appear here.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open notification: Assignment 1" })).toBeVisible();
    await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
  });

  test("reading the last unread page reconciles rows, counts and page number", async ({ page }) => {
    await page.goto("/notifications");
    await page.getByRole("combobox", { name: "Read Status", exact: true }).selectOption("unread");
    await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next Page", exact: true }).click();
    await expect(page.getByText("Page 2 of 2", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open notification: Assignment 6" }).click();
    await expect(page.getByText("Page 1 of 1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close Notification Details" }).click();
    await expect(page.getByRole("button", { name: "Open notification: Assignment 6" })).toHaveCount(0);
    await expect(page.getByText("5 unread notifications need your attention.")).toBeVisible();
    await page.getByRole("button", { name: "Mark All as Read", exact: true }).click();
    await expect(page.getByText("No notifications match your filters", { exact: true })).toBeVisible();
    expect(items.every(item => item.isRead)).toBe(true);
  });

  test("failed read saves preserve unread state and repeated opens do not decrement twice", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByText("6 unread notifications need your attention.")).toBeVisible();
    failRead = true;
    await page.getByRole("button", { name: "Open notification: Assignment 1" }).click();
    await expect(page.getByText("Read status could not be saved", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close Notification Details" }).click();
    expect(items[0].isRead).toBe(false);
    failRead = false;
    await page.getByRole("button", { name: "Open notification: Assignment 1" }).click();
    await expect(page.getByText("5 unread notifications need your attention.")).toBeVisible();
    await page.getByRole("button", { name: "Close Notification Details" }).click();
    await page.getByRole("button", { name: "Open notification: Assignment 1" }).click();
    await expect(page.getByText("5 unread notifications need your attention.")).toBeVisible();
  });

  test("load failure does not claim the inbox is caught up", async ({ page }) => {
    failList = true;
    await page.goto("/notifications");
    await expect(page.getByText("Your notification inbox could not be loaded. Try refreshing.")).toBeVisible();
    await expect(page.getByText(/You’re caught up/)).toHaveCount(0);
    failList = false;
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(page.getByText("6 unread notifications need your attention.")).toBeVisible();
  });

  test("focus refreshes the open inbox and header unread badge", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("link", { name: "Notifications, 6 unread" })).toBeVisible();
    items[0].isRead = true;
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByRole("link", { name: "Notifications, 5 unread" })).toBeVisible();
    await expect(page.getByText("5 unread notifications need your attention.")).toBeVisible();
  });

  test("phone filters collapse and metadata uses readable references", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/notifications");
    await expect(page.getByRole("button", { name: "Open notification: Assignment 1" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Read Status", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Filters Show", exact: true }).click();
    await page.getByRole("combobox", { name: "Read Status", exact: true }).selectOption("unread");
    await expect(page.getByRole("button", { name: "Filters (1) Hide", exact: true })).toBeVisible();
    await expect(page.getByText("WO-202610-001", { exact: true })).toBeVisible();
    await expect(page.getByText("a".repeat(24), { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
