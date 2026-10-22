import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

test.describe("agency physical repair tracking", () => {
  let server: Server;
  let saved: Record<string, unknown>;
  let requests: Record<string, unknown>[];
  test.beforeAll(async () => {
    saved = { id: "report", reportNumber: "LUNAS-TRACKING", category: "road", status: "provider_assigned", agencyStatus: "ready_for_work", images: [], location: { coordinates: [120.3, 16], address: { barangay: "Pantal", city: "Dagupan City" } }, routing: { responsibleOrganization: "Test Agency" }, sla: {}, maintenance: { progressPercent: 0, active: false, cycles: [] } };
    requests = [];
    server = createServer(async (req, res) => {
      const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/users/me") return send({ id: "provider", role: "utility_provider", firstName: "Test", lastName: "Agency", email: "agency@example.test", isActive: true, utilityCompany: "Test Agency" });
      if (path.endsWith("/agency-status")) {
        let raw = ""; for await (const chunk of req) raw += chunk;
        const body = JSON.parse(raw) as Record<string, unknown>;
        requests.push(body);
        if (body.note === "reject-update") { res.statusCode = 409; return res.end(JSON.stringify({ success: false, message: "Recorded progress cannot decrease" })); }
        saved = { ...saved, agencyStatus: body.status, priority: body.priority, procurementRequired: body.procurementRequired ?? saved.procurementRequired, expectedTimeline: body.expectedTimeline,
          sla: { deadline: body.slaDeadline || "2026-12-01T00:00:00Z", targetResolutionTime: 72 },
          maintenance: { progressPercent: body.status === "work_completed" ? 100 : body.progressPercent, active: body.status === "work_in_progress", cycles: [{ reference: "cycle-1", startedAt: "2026-10-22T01:00:00Z", completedAt: body.status === "work_completed" ? "2026-10-22T03:00:00Z" : null, elapsedMilliseconds: 7200000 }] } };
        return send(saved);
      }
      if (path === "/incidents/report") return send(saved);
      if (path === "/notifications") return send([]);
      return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
  test("agency skips unnecessary procurement, saves actual percentages and preserves failed updates", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "test-provider" }), url: baseURL!, httpOnly: true }]);
    await page.goto("/work-orders/intake/report");
    await page.getByLabel("Agency priority").filter({ visible: true }).selectOption("high");
    await page.getByLabel("Agency SLA deadline").filter({ visible: true }).fill("2026-12-01T08:00");
    await page.getByLabel("Expected timeline").filter({ visible: true }).fill("Finish road patching by the approved deadline");
    await page.getByRole("button", { name: "Continue to Next Step" }).filter({ visible: true }).click();
    await page.getByRole("button", { name: "Confirm Status", exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole("button", { name: "Save repair progress" }).filter({ visible: true })).toBeVisible();
    expect(requests[0]).toMatchObject({ status: "work_in_progress", procurementRequired: false, slaDeadline: "2026-12-01T00:00:00.000Z" });
    await page.getByLabel("Physical repair progress (%)", { exact: true }).filter({ visible: true }).fill("45");
    await page.getByRole("button", { name: "Save repair progress" }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: "Physical repair progress: 45%" }).filter({ visible: true })).toBeVisible();
    await page.getByPlaceholder("Agency update or external reference").filter({ visible: true }).fill("reject-update");
    await page.getByRole("button", { name: "Save repair progress" }).filter({ visible: true }).click();
    await expect(page.getByRole("status").filter({ visible: true }).filter({ hasText: "Recorded progress cannot decrease" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Physical repair progress: 45%" }).filter({ visible: true })).toBeVisible();
    await page.getByPlaceholder("Agency update or external reference").filter({ visible: true }).fill("Repair completed");
    await page.getByRole("button", { name: "Continue to Next Step" }).filter({ visible: true }).click();
    await page.getByRole("button", { name: "Confirm Status", exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole("heading", { name: "Physical repair progress: 100%" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Agency completed:.*11:00/).filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Elapsed repair time: 0d 2h 0m 0s").filter({ visible: true })).toBeVisible();
  });
});
