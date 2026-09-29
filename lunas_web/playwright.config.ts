import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = `http://127.0.0.1:${port}`;
const accountUiTests = process.env.ACCOUNT_UI_TESTS === "true";

// The production server requires a configured session key. Give the isolated
// local account UI fixture one stable key when the opt-in test mode is used;
// real deployments must continue to provide their own high-entropy value.
if (accountUiTests && !process.env.LUNAS_SESSION_SECRET) {
  process.env.LUNAS_SESSION_SECRET = "lunas-playwright-account-ui-test-secret";
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run start -- -p ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !accountUiTests,
    timeout: 60_000,
  },
});
