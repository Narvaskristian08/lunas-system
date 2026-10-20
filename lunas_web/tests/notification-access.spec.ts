import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";
let server: Server;
let available = true;
const id = "507f191e810c19729de860a1";
test.beforeAll(async () => {
  server = createServer((req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    const notification = { _id: id, type: "incident_validated", title: available ? "Agency update" : "Historical notification", message: available ? "Authorized agency receipt" : "The linked record is unavailable for your current access.", createdAt: "2026-10-20T00:00:00Z", isRead: true, resourceAvailable: available, data: available ? { incidentId: id, reportNumber: "REF-TEST" } : {} };
    if (path === "/users/me") return res.end(JSON.stringify({ success: true, data: { id, firstName: "Agency", lastName: "Officer", role: "utility_provider", utilityCompany: "Test agency", email: "agency@example.test", isActive: true } }));
    if (path === "/notifications") return res.end(JSON.stringify({ success: true, data: [notification], pagination: { total: 1, pages: 1 }, unreadCount: 0 }));
    if (path.startsWith("/notifications/")) return res.end(JSON.stringify({ success: true, data: notification }));
    return res.end(JSON.stringify({ success: true, data: [] }));
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
test.beforeEach(async ({ context, baseURL }) => {
  available = true;
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "test-agency" }), url: baseURL!, httpOnly: true }]);
});
test("agency incident notification opens intake rather than nonexistent work order", async ({ page }) => {
  await page.goto(`/notifications?notification=${id}`);
  await expect(page.getByRole("link", { name: "Incident", exact: true })).toHaveAttribute("href", `/work-orders/intake/${id}`);
});
test("revoked notification keeps safe history without operational navigation", async ({ page }) => {
  available = false;
  await page.goto(`/notifications?notification=${id}`);
  await expect(page.getByText("The linked record is unavailable for your current access.").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Incident", exact: true })).toHaveCount(0);
});
