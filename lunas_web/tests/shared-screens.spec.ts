import { expect, test, type Page } from "@playwright/test";

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test("login has no preview credentials and validates required fields", async ({ page }) => {
  // This test exercises form validation, not the external CAPTCHA service.
  await page.route("https://challenges.cloudflare.com/turnstile/**", route => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile = {
      render(element, options) {
        this.verify = () => options.callback('browser-test-captcha');
        setTimeout(this.verify, 0);
        return 'test-widget';
      },
      reset() { setTimeout(this.verify, 0); }
    };`,
  }));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to LUNAS" })).toBeVisible();
  await expect(page.getByText("Role mockup accounts")).toHaveCount(0);
  await expect(page.getByText("LunasDemo!2026")).toHaveCount(0);

  await page.getByRole("button", { name: "Sign in to command center" }).click();
  await expect(page.getByText("Review the highlighted fields.")).toBeVisible();
  await expect(page.getByText("Enter your authorized email address.")).toBeVisible();
  await expectNoPageOverflow(page);
});

test("protected web routes redirect an anonymous visitor to real sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard|\/login\?next=\/dashboard/);

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fprofile|\/login\?next=\/profile/);

  await page.goto("/work-orders");
  await expect(page).toHaveURL(/\/login\?next=%2Fwork-orders|\/login\?next=\/work-orders/);

  await page.goto("/work-orders/intake");
  await expect(page).toHaveURL(/\/login\?next=%2Fwork-orders%2Fintake|\/login\?next=\/work-orders\/intake/);
});

test("password reset requires email code verification before showing passwords and public legal states render", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: "Verify your reset code" })).toBeVisible();
  await expect(page.getByLabel("Verification code")).toBeVisible();
  await expect(page.getByLabel("New Password", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Verify Code", exact: true })).toBeDisabled();

  await page.goto("/privacy");
  await expect(page.getByText(/New evidence images are checked by the backend privacy detector/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms and Conditions" })).toBeVisible();
});

test("citizen registration shows email verification and returns to sign in", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your LUNAS account" })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue to email verification/i })).toBeVisible();
  await expectNoPageOverflow(page);

  await page.goto("/register/verify");
  await expect(page.getByRole("heading", { name: "Verify your email address" })).toBeVisible();
  await expect(page.getByText("This verification session is no longer available on this device.")).toBeVisible();

  await page.goto("/login?registered=1");
  await expect(page.getByText("Account created successfully", { exact: true })).toBeVisible();
});
