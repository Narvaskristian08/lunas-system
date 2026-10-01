import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = `http://127.0.0.1:${port}`;

// The standalone server always runs in production mode and therefore requires
// explicit isolated test configuration. Real deployments must provide their
// own unrelated, high-entropy session secret.
process.env.LUNAS_SESSION_SECRET ??= "lunas-playwright-isolated-session-secret-only";
process.env.LUNAS_API_URL ??= "http://127.0.0.1:5119/api/v1";

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
});
