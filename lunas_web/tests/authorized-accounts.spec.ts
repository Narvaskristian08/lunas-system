import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";
import type { AuthorizedAccount } from "../src/lib/authorized-accounts";

// UI/BFF contract tests use a local API fixture. Real database/security tests
// live in lunas_backend/src/controllers/authorizedAccounts.integration.test.js.
const enabled = process.env.ACCOUNT_UI_TESTS === "true";
test.describe("authorized account screens", () => {
  test.skip(!enabled, "Set ACCOUNT_UI_TESTS=true and LUNAS_API_URL=http://127.0.0.1:5119/api/v1");
  let server: Server;
  let accounts: AuthorizedAccount[] = [];
  const adminId = "507f191e810c19729de860a1";
  test.beforeAll(async () => {
    server = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const input = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
      const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown, message = "Account updated") => res.end(JSON.stringify({ success: true, data, message }));
      if (path === "/users/me") return send({ id: adminId, firstName: "Test", lastName: "Administrator", email: "admin@example.test", role: req.headers.authorization?.includes("citizen") ? "citizen" : "admin", isActive: true, isVerified: true });
      if (path === "/users/authorized" && req.method === "GET") return send({ accounts, pagination: { page: 1, limit: 20, total: accounts.length, pages: 1 }, roles: ["barangay_official", "city_engineer", "repair_personnel", "utility_provider", "admin"], barangays: ["Pantal", "Lucao"], canManageAdministrators: false });
      if (path === "/users/authorized" && req.method === "POST") {
        accounts.push({ ...input, id: "507f191e810c19729de860b1", accountStatus: "pending_activation", version: 0, requiresActivation: true, approval: { authority: input.approvalAuthority, reference: input.approvalReference } });
        return send({}, "Account created. Activation email sent.");
      }
      if (path.endsWith("/status")) {
        accounts[0].accountStatus = input.status;
        accounts[0].version++;
        return send({}, "Account status updated. Previous sessions revoked.");
      }
      if (path === "/auth/activate-account") {
        if (input.token !== "a".repeat(64)) { res.statusCode = 400; return send({}, "Invalid activation link"); }
        return send({}, "Account activated");
      }
      res.statusCode = 404; return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
  test.beforeEach(() => { accounts = []; });

  test("administrator creates an approved account, views Pending Activation, and confirms deactivation", async ({ page, context }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-admin" }), url: "http://127.0.0.1:3100", httpOnly: true, sameSite: "Lax" }]);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Authorized accounts", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Create Authorized Account", exact: true }).click();
    await page.getByLabel("First name").fill("Ana");
    await page.getByLabel("Last name").fill("Santos");
    await page.getByLabel("Email", { exact: false }).fill("ana@example.test");
    await page.getByLabel("Contact number").fill("09123456789");
    await page.getByLabel("Position / designation").fill("Barangay official");
    await page.getByLabel("Office / organization").fill("Barangay Pantal");
    await page.getByLabel("Assigned barangay").selectOption("Pantal");
    await page.getByLabel("Approved by / approving authority").fill("Responsible superior");
    await page.getByLabel("Approval reference / remarks").fill("Offline approval REF-001");
    await expect(page.getByLabel("System role").locator('option[value="admin"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Create account and send activation" }).click();
    await expect(page.getByRole("cell", { name: "Pending Activation", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "View", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ana Santos" })).toBeVisible();
    await page.getByRole("button", { name: "Deactivate", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Deactivate", exact: true }).click();
    await expect(dialog.getByText("Enter the reason for this access change.")).toBeVisible();
    await dialog.getByLabel("Reason (required)").fill("Personnel transferred");
    await dialog.getByRole("button", { name: "Deactivate", exact: true }).click();
    await expect(page.getByRole("cell", { name: "Deactivated", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
  test("citizen cannot open the protected administrator screen", async ({ page, context }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-citizen" }), url: "http://127.0.0.1:3100" }]);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole("button", { name: "Create Authorized Account" })).toHaveCount(0);
  });
  test("activation uses the email fragment, removes it from history, and permits password setup", async ({ page }) => {
    await page.goto(`/activate-account#token=${"a".repeat(64)}`);
    await expect(page).toHaveURL(/\/activate-account$/);
    await page.getByLabel("Create password", { exact: true }).fill("AccountTest2026!");
    await page.getByLabel("Confirm password", { exact: true }).fill("AccountTest2026!");
    await page.getByRole("button", { name: "Activate account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Account activated" })).toBeVisible();
  });
});
