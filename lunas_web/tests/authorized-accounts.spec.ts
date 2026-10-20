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
      if (path === "/notifications") return send([]);
      if (path === "/users/authorized" && req.method === "GET") return send({ accounts, pagination: { page: 1, limit: 20, total: accounts.length, pages: 1 }, roles: ["barangay_official", "utility_personnel", "utility_provider", "admin"], barangays: ["Pantal", "Lucao"], canManageAdministrators: false });
      if (path === "/users/authorized" && req.method === "POST") {
        accounts.push({ ...input, id: "507f191e810c19729de860b1", accountStatus: "pending_activation", version: 0, requiresActivation: true, approval: { authority: input.approvalAuthority, reference: input.approvalReference } });
        return send({}, "Account created. Activation email sent.");
      }
      if (/^\/users\/authorized\/[^/]+\/status$/.test(path) && req.method === "PATCH") {
        accounts[0].accountStatus = input.status;
        accounts[0].version++;
        return send({}, "Account status updated. Previous sessions revoked.");
      }
      if (path === "/auth/activate-account") {
        if (input.token !== "a".repeat(64)) { res.statusCode = 400; return send({}, "Invalid activation link"); }
        return send({}, "Account Activated");
      }
      res.statusCode = 404; return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
  test.beforeEach(() => { accounts = []; });

  test("profile opens over the workspace from the menu and the legacy URL", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-admin" }), url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
    await page.goto("/admin/users");
    const menu = page.getByRole("button", { name: /Test Administrator/ });
    await menu.click();
    await page.getByRole("menuitem", { name: "View Profile", exact: true }).click();
    const profile = page.getByRole("dialog", { name: "My Profile", exact: true });
    await expect(profile).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(profile.getByRole("link", { name: "Edit Profile", exact: true })).toHaveCount(0);
    await expect(profile.getByRole("button", { name: "Change Password", exact: true })).toHaveCount(0);
    const password = page.getByRole("dialog", { name: "Change Password", exact: true });
    const desktopBounds = await profile.boundingBox();
    const viewport = page.viewportSize()!;
    expect(Math.abs(desktopBounds!.x + desktopBounds!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(desktopBounds!.y + desktopBounds!.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
    await expect(profile).toHaveCSS("position", "fixed");
    await page.keyboard.press("Escape");
    await expect(profile).not.toBeVisible();
    await expect(menu).toBeFocused();

    await page.goto("/profile/edit");
    await expect(page).toHaveURL(/\/admin\/users\?profile=1$/);
    await expect(profile).toBeVisible();
    await page.setViewportSize({ width: 390, height: 700 });
    const bounds = await profile.boundingBox();
    expect(bounds?.width).toBeLessThanOrEqual(390);
    expect(bounds?.height).toBeLessThanOrEqual(700);
    expect(Math.abs(bounds!.x + bounds!.width / 2 - 195)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - 350)).toBeLessThanOrEqual(1);
    await profile.getByRole("button", { name: "Close My Profile" }).click();
    await expect(profile).not.toBeVisible();
    await expect(page).toHaveURL(/\/admin\/users$/);
    await page.goto("/profile/change-password");
    await expect(password).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/users\?profile=password$/);
    await password.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(password).not.toBeVisible();
    await expect(page).toHaveURL(/\/admin\/users$/);
  });

  test("confirmation layout has equal actions on desktop and mobile", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-admin" }), url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
    await page.goto("/admin/users");
    await page.getByRole("button", { name: /Test Administrator/ }).click();
    await page.getByRole("menuitem", { name: /Sign Out/i }).click();
    const dialog = page.getByRole("dialog", { name: "Sign out of LUNAS?" });
    const confirm = dialog.getByRole("button", { name: "Confirm Sign Out" });
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    await expect(dialog).toBeVisible();
    await expect(cancel).toBeFocused();
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 700 });
      const first = (await confirm.boundingBox())!;
      const second = (await cancel.boundingBox())!;
      expect(first.height).toBeGreaterThanOrEqual(48);
      expect(second.height).toBeGreaterThanOrEqual(48);
      expect(Math.abs(first.width - second.width)).toBeLessThanOrEqual(1);
      if (width < 640) expect(first.y).toBeLessThan(second.y);
      else expect(first.y).toBe(second.y);
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("administrator creates an approved account, views Pending Activation, and confirms deactivation", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-admin" }), url: baseURL!, httpOnly: true, sameSite: "Lax" }]);
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Authorized Accounts", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Create Authorized Account", exact: true }).click();
    const createDialog = page.getByRole("dialog", { name: "Create Authorized Account", exact: true });
    await expect(createDialog).toBeVisible();
    expect(await createDialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(createDialog).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Create Authorized Account", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Create Authorized Account", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 700 });
    const modalBounds = await createDialog.boundingBox();
    expect(modalBounds?.width).toBeLessThanOrEqual(390);
    expect(modalBounds?.height).toBeLessThanOrEqual(700);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByLabel("First Name").fill("Ana");
    await page.getByLabel("Last Name").fill("Santos");
    await page.getByLabel("Email", { exact: false }).fill("ana@example.test");
    await expect(page.getByLabel("Contact Number")).toHaveCount(0);
    await page.getByLabel("Position / Designation").fill("Barangay official");
    await page.getByLabel("Office / Organization").fill("Barangay Pantal");
    await page.getByLabel("Assigned Barangay").selectOption("Pantal");
    await page.getByLabel("Approved By / Approving Authority").fill("Responsible superior");
    await page.getByLabel("Approval Reference / Remarks").fill("Offline approval REF-001");
    await expect(page.getByLabel("System Role").locator('option[value="admin"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Create Account and Send Activation" }).click();
    await page.getByRole("button", { name: "Create and Send Activation", exact: true }).click();
    await expect(page.getByRole("cell", { name: "Pending Activation", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "View", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ana Santos" })).toBeVisible();
    await page.getByRole("button", { name: "Deactivate", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Deactivate", exact: true }).click();
    await expect(dialog.getByText("Enter the reason for this access change.")).toBeVisible();
    await dialog.getByLabel("Reason (Required)").fill("Personnel transferred");
    await dialog.getByRole("button", { name: "Deactivate", exact: true }).click();
    await expect(page.getByRole("cell", { name: "Deactivated", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
  test("citizen cannot open the protected administrator screen", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-citizen" }), url: baseURL! }]);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/unauthorized(?:\?.*)?$/);
    await expect(page.getByRole("button", { name: "Create Authorized Account" })).toHaveCount(0);
  });
  test("activation uses the email fragment, removes it from history, and permits password setup", async ({ page }) => {
    await page.goto(`/activate-account#token=${"a".repeat(64)}`);
    await expect(page).toHaveURL(/\/activate-account$/);
    await page.getByLabel(/^Create password/i).fill("AccountTest2026!");
    await page.getByLabel(/^Confirm password/i).fill("AccountTest2026!");
    await page.getByRole("button", { name: "Activate Account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Account Activated" })).toBeVisible();
  });
});
