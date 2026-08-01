import { expect, test, type Page } from "@playwright/test";

const credentials = {
  email: "carlo.mendoza@lunas.gov.ph",
  password: "LunasDemo!2026",
};

const roleMockups = [
  { role: "Barangay Official", heading: "Good morning, Maria" },
  { role: "City Engineering Office", heading: "Engineering operations" },
  { role: "Utility Provider", heading: "Utility work queue" },
  { role: "System Administrator", heading: "Command center health" },
  { role: "Maintenance Coordinator", heading: "Repair operations" },
  { role: "Executive Viewer", heading: "Infrastructure performance" },
] as const;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Authorized email address").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in to command center" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Command center health" })).toBeVisible();
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("public authentication states validate and remain responsive", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to LUNAS" })).toBeVisible();
  await expect(page.getByText("One trusted view of the city's infrastructure response.")).toBeVisible();
  await page.screenshot({ path: "test-results/login-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Sign in to command center" }).click();
  await expect(page.getByText("Review the highlighted fields.")).toBeVisible();
  await expect(page.getByText("Enter your authorized email address.")).toBeVisible();

  await page.goto("/forgot-password");
  await page.getByLabel("Authorized email address").fill("unknown.person@agency.gov.ph");
  await page.getByRole("button", { name: "Send reset instructions" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await expect(page.getByText(/cannot confirm whether an account exists/i)).toBeVisible();

  await page.goto("/reset-password?status=expired");
  await expect(page.getByRole("heading", { name: "Reset link expired" })).toBeVisible();
  await page.goto("/verify-account?status=already");
  await expect(page.getByRole("heading", { name: "Account already verified" })).toBeVisible();
  await expectNoPageOverflow(page);
});

test("authenticated dashboard changes with the permission-backed role", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("System Administrator", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Service availability")).toBeVisible();
  await expect(page.getByRole("region", { name: /Priority active incidents/ })).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
  await expectNoPageOverflow(page);

  await page.getByRole("button", { name: /Carlo Mendoza/ }).click();
  await page.getByLabel("Preview another role").selectOption("Executive Viewer");
  await expect(page.getByRole("heading", { name: "Infrastructure performance" })).toBeVisible();
  await expect(page.getByText("Read-only executive view")).toBeVisible();
  await expect(page.getByText("User management", { exact: true })).toHaveCount(0);
});

test("all role mockup accounts open their custom dashboard", async ({ page, context }) => {
  test.setTimeout(60_000);

  for (const mockup of roleMockups) {
    await context.clearCookies();
    await page.goto("/login");
    await page.getByRole("button", { name: `Use ${mockup.role} mockup account` }).click();
    await page.getByRole("button", { name: "Sign in to command center" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: mockup.heading })).toBeVisible();
  }
});

test("notification filters, selection, detail and restricted link state work", async ({ page }) => {
  await signIn(page);
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByText("New pothole report requires validation")).toBeVisible();

  await page.getByLabel("Search notifications").fill("SLA deadline");
  await expect(page.getByText("SLA deadline approaching for incident INC-2026-0087")).toBeVisible();
  await expect(page.getByText("New pothole report requires validation")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset" }).click();

  await page.getByLabel("Select New pothole report requires validation").check();
  await page.getByRole("button", { name: "Mark selected as read" }).click();
  await expect(page.getByText("1 notification marked as read")).toBeVisible();

  await page.goto("/notifications/NTF-2026-0811");
  await expect(page.getByText("Incident INC-2026-0042 has been escalated")).toBeVisible();
  await expect(page.getByText(/unavailable or restricted/i)).toBeVisible();
  await page.screenshot({ path: "test-results/notification-detail.png", fullPage: true });
});

test("profile edit constraints and logout dialog keyboard behavior work", async ({ page }) => {
  await signIn(page);
  await page.goto("/profile/edit");
  await expect(page.getByRole("heading", { name: "Edit profile" })).toBeVisible();
  await expect(page.getByLabel("Role")).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Organization")).toHaveAttribute("readonly", "");

  await page.goto("/profile");
  await page.getByRole("button", { name: /Carlo Mendoza/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("dialog", { name: "Sign out of LUNAS?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Sign out of LUNAS?" })).toHaveCount(0);
});

test("mobile shell uses a drawer and avoids page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("complementary", { name: "Mobile navigation" })).toBeVisible();
  await expect(page.getByText("System Administrator", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("complementary", { name: "Mobile navigation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
});

test("legal, help, unauthorized, maintenance, and not-found routes render", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByText(/legal review/i).first()).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms and Conditions" })).toBeVisible();
  await page.goto("/maintenance?mode=read-only");
  await expect(page.getByRole("heading", { name: "LUNAS is available in read-only mode" })).toBeVisible();
  await expect(page.getByText("No estimate has been published.")).toBeVisible();
  await page.goto("/definitely-missing");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  await signIn(page);
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Help and support" })).toBeVisible();
  await page.getByLabel("Search help topics").fill("SLA");
  await expect(page.getByText("SLA monitoring", { exact: true })).toBeVisible();
  await page.goto("/unauthorized?context=settings");
  await expect(page.getByRole("heading", { name: "This area is not available to your account" })).toBeVisible();
  await expect(page.getByText("System configuration", { exact: true })).toBeVisible();
});
