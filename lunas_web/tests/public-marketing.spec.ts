import { expect, test } from "@playwright/test";

test("public marketing and academic pages render without a session", async ({ page }) => {
  const pages = [
    { path: "/", heading: "Smarter Reporting. Better Coordination. Stronger Communities." },
    { path: "/research", heading: /LUNAS: An AI-Assisted Urban Infrastructure Maintenance/ },
    { path: "/about", heading: /capstone prototype for clearer infrastructure reporting/ },
    { path: "/demo", heading: /Explore the LUNAS prototype/ },
    { path: "/privacy", heading: /Website privacy notice/ },
  ];

  for (const item of pages) {
    const response = await page.goto(item.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: item.heading })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\b(draft|placeholder|not supplied|not available)\b/i);
  }
});

test("mobile navigation opens, follows a public route, and closes accessibly", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await menuButton.click();
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");

  await page.locator("#public-primary-navigation").getByRole("link", { name: "Research" }).click();
  await expect(page).toHaveURL(/\/research$/);
  await expect(page.getByRole("heading", { level: 1, name: /LUNAS: An AI-Assisted Urban Infrastructure Maintenance/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute("aria-expanded", "false");
});

test("public pages fit narrow viewports and demo previews do not request visitor details", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, "horizontal overflow at " + width).toBeLessThanOrEqual(width);
  }

  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "From an infrastructure report to coordinated maintenance" })).toBeVisible();
  await expect(page.getByAltText("Citizen mobile dashboard with synthetic demonstration reports")).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
});

test("anonymous visitors can reach the landing page but not protected workspaces", async ({ page }) => {
  const home = await page.goto("/");
  expect(home?.status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Sign in to LUNAS" })).toBeVisible();
});
