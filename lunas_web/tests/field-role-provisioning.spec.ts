import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

// UI-only contracts. The real provisioning permission/validation is tested by
// backend fieldRoleAccess; these fixtures never connect to MongoDB or email.
let server: Server;
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
    res.setHeader("Content-Type", "application/json");
    const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
    if (path === "/users/me") return send({ id: "507f191e810c19729de860a1", firstName: "Test", lastName: "Person", email: "test@example.test", role: req.headers.authorization?.includes("tanod") ? "barangay_tanod" : "admin", isActive: true });
    if (path === "/users/authorized") return send({ accounts: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 }, roles: ["barangay_official", "barangay_tanod", "repair_personnel", "utility_provider"], barangays: ["Pantal"], canManageAdministrators: false });
    if (path === "/notifications") return send([]);
    res.statusCode = 404; return send({});
  });
  await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
});
test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });

test("administrator sees distinct Tanod and Repair Personnel provisioning fields", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-admin" }), url: baseURL!, httpOnly: true }]);
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Create Authorized Account", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create Authorized Account", exact: true });
  await dialog.getByLabel("System Role").selectOption("barangay_tanod");
  await expect(dialog.getByLabel("Assigned Barangay")).toHaveAttribute("required", "");
  await expect(dialog.getByLabel("Repair organization")).toHaveCount(0);
  await expect(dialog.getByText(/This account is a Barangay Tanod account/)).toBeVisible();
  await dialog.getByLabel("System Role").selectOption("repair_personnel");
  await expect(dialog.getByLabel("Repair organization")).toBeVisible();
  await expect(dialog.getByLabel("Assigned Barangay")).not.toHaveAttribute("required");
  await expect(dialog.getByText(/This account is a Barangay Tanod account/)).toHaveCount(0);
});

test("Tanod cannot enter the web administrator workspace", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-tanod" }), url: baseURL!, httpOnly: true }]);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/unauthorized/);
  await expect(page.getByRole("button", { name: "Create Authorized Account", exact: true })).toHaveCount(0);
});
