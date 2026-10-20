// Explicit opt-in: an owned disposable replica set and actual API, never a supplied DB URI.
import { createRequire } from "node:module";
import path from "node:path";
import type { Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";
const backend = createRequire(path.join(process.cwd(), "package.json"));
test.skip(process.env.LUNAS_NATIVE_BROWSER !== "1", "Requires the explicit disposable MongoDB/browser harness");
let api: Server;
let database: { stop: () => Promise<void> };
let token: string;
const dbName = `lunas_browser_test_${process.pid}_${Date.now()}`;
test.beforeAll(async () => {
  test.setTimeout(60000);
  if (!process.env.LUNAS_TEST_MONGODB_BINARY || !path.isAbsolute(process.env.LUNAS_TEST_MONGODB_BINARY)) throw new Error("An explicit cached test MongoDB binary is required; no automatic download");
  const { MongoMemoryReplSet } = backend("../lunas_backend/node_modules/mongodb-memory-server");
  const mongoose = backend("../lunas_backend/node_modules/mongoose");
  const express = backend("../lunas_backend/node_modules/express");
  const replica = await MongoMemoryReplSet.create({ binary: { systemBinary: process.env.LUNAS_TEST_MONGODB_BINARY }, replSet: { count: 1, ip: "127.0.0.1", storageEngine: "wiredTiger" }, instanceOpts: [{ args: ["--wiredTigerCacheSizeGB", "0.25"] }] });
  database = replica;
  await mongoose.connect(replica.getUri(), { dbName });
  process.env.JWT_SECRET = "native-browser-test-secret-only"; process.env.OPERATIONAL_REPORT_CSV_ROLES = ""; process.env.OPERATIONAL_REPORT_PDF_ROLES = "";
  const User = backend("../lunas_backend/src/models/User"); const Incident = backend("../lunas_backend/src/models/Incident");
  await Promise.all([User.init(), Incident.init()]);
  const secretary = await User.create({ firstName: "Native", lastName: "Secretary", email: "native-secretary@example.test", password: "NativeFixtureOnly2026!", phone: "09123456789", role: "barangay_official", barangay: "Pantal", isActive: true, isVerified: true });
  token = backend("../lunas_backend/src/utils/authTokens").createAccessToken(secretary);
  await Incident.insertMany(Array.from({ length: 237 }, (_, index) => ({ reportNumber: `BROWSER-NATIVE-${index}`, reporter: secretary._id, category: "road", status: "submitted", description: "Synthetic native browser fixture", createdAt: new Date("2026-10-20"), location: { type: "Point", coordinates: [120.34, 16.04], address: { barangay: "Pantal" } }, jurisdiction: { barangay: "Pantal" } })));
  const app = express(); app.use(express.json()); app.use("/api/v1/users", backend("../lunas_backend/src/routes/userRoutes")); app.use("/api/v1/operational-reports", backend("../lunas_backend/src/routes/operationalReportRoutes")); app.use(backend("../lunas_backend/src/middleware/errorHandler"));
  api = await new Promise<Server>(resolve => { const server = app.listen(5119, "127.0.0.1", () => resolve(server)); });
});
test.afterAll(async () => {
  if (api) await new Promise<void>(resolve => api.close(() => resolve()));
  const mongoose = backend("../lunas_backend/node_modules/mongoose");
  if (mongoose.connection.db?.databaseName === dbName) await mongoose.connection.dropDatabase();
  await mongoose.disconnect(); if (database) await database.stop();
});
test("browser uses real JWT/API/MongoDB reporting and default-denied export", async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: token }), url: baseURL!, httpOnly: true }]);
  await page.goto("/validation-routing/reports?date=2026-10-20&limit=100");
  await expect(page.getByRole("table")).toContainText("237 matching incidents");
  await page.getByRole("link", { name: "Next page" }).click(); await expect(page.getByRole("table")).toContainText("page 2 of 3");
  expect((await page.request.get("/validation-routing/reports/export?format=csv&date=2026-10-20")).status()).toBe(403);
  await page.goto("/validation-routing/reports?date=2026-10-20&barangay=Bolosan");
  await expect(page.locator("#main-content").getByRole("alert")).toContainText("outside your reporting scope");
});
