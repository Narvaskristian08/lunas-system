import { philippineDeadlineInput, philippineDeadlineIso } from "../src/lib/agency-schedule";
import { createServer, type Server } from "node:http";
import { expect, test } from "@playwright/test";
import { createSessionValue } from "../src/lib/auth/session-crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/constants";

test.describe("Infrastructure Committee agency schedule", () => {
  let server: Server;
  test.beforeAll(async () => {
    server = createServer((req, res) => {
      const path = new URL(req.url!, "http://localhost").pathname.replace("/api/v1", "");
      res.setHeader("Content-Type", "application/json");
      const send = (data: unknown) => res.end(JSON.stringify({ success: true, data }));
      if (path === "/users/me") return send({ id: "official", role: "barangay_official", firstName: "Ana", lastName: "Reviewer", email: "reviewer@example.test", barangay: "Pantal", organization: "Barangay Pantal", isActive: true });
      if (path === "/notifications" || path.endsWith("/history") || path.endsWith("/duplicate-candidates")) return send([]);
      if (/^\/incidents\/[^/]+$/.test(path)) {
        const id = path.split("/").pop();
        const state = id === "resolved" ? "resolved" : id === "completed" ? "awaiting_verification" : id === "missing" ? "awaiting_schedule" : "active";
        return send({ id, reportNumber: "LUNAS-SCHEDULE-TEST", status: id === "resolved" ? "closed" : "provider_assigned", category: "road", images: [],
          location: { coordinates: [120.3, 16.0], address: { barangay: "Pantal", city: "Dagupan City" } },
          agencySchedule: { state, asOf: new Date().toISOString(), deadline: id === "missing" ? null : "2026-10-23T08:00:00Z", startedAt: "2026-10-20T08:00:00Z", durationMilliseconds: 60000, remainingMilliseconds: id === "missing" ? null : id === "overdue" ? -60000 : 30000 } });
      }
      return send({});
    });
    await new Promise<void>(resolve => server.listen(5119, "127.0.0.1", resolve));
  });
  test.afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
  test.beforeEach(async ({ context, baseURL }) => {
    await context.addCookies([{ name: SESSION_COOKIE_NAME, value: createSessionValue({ accessToken: "ui-official" }), url: baseURL!, httpOnly: true }]);
  });
  test("read-only countdown decreases and shows the Philippine deadline", async ({ page }) => {
    await page.goto("/validation-routing/active");
    const card = page.getByRole("region", { name: "Agency schedule" });
    await expect(card.getByText(/4:00 PM.*Philippine time/)).toBeVisible();
    const bar = card.getByRole("progressbar", { name: "Agency time remaining" });
    await expect.poll(async () => Number(await bar.getAttribute("aria-valuenow"))).toBeLessThan(50);
    await expect(card.getByRole("slider")).toHaveCount(0);
  });
  test("terminal states stop the timer and missing/overdue targets stay explicit", async ({ page }) => {
    for (const [id, label] of [["completed", "Awaiting final verification"], ["resolved", "Resolved"], ["missing", "Awaiting agency schedule"], ["overdue", "Deadline passed"]]) {
      await page.goto(`/validation-routing/${id}`);
      const card = page.getByRole("region", { name: "Agency schedule" });
      await expect(card.getByText(label, { exact: true })).toBeVisible();
      if (id === "missing") await expect(card.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
      if (id === "overdue") await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    }
  });
});


test("Philippine deadline input round-trips the saved timestamp without a server-timezone shift", () => {
  const saved = "2026-10-23T08:00:00.000Z";
  expect(philippineDeadlineInput(saved)).toBe("2026-10-23T16:00");
  expect(philippineDeadlineIso("2026-10-23T16:00")).toBe(saved);
  expect(philippineDeadlineIso(saved)).toBe(saved);
  expect(philippineDeadlineIso("bad")).toBeUndefined();
});
