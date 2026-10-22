import { expect, test } from "@playwright/test";
import { reportAnchor, reportCategorySummary, reportRange } from "../src/lib/report-export";

test("Philippine days cross UTC midnight and weeks run Monday through Sunday", () => {
  expect(reportRange("daily", new Date("2026-10-21T16:01:00Z"))).toEqual({ from: "2026-10-22", to: "2026-10-22" });
  expect(reportRange("weekly", new Date("2026-10-25T04:00:00Z"))).toEqual({ from: "2026-10-19", to: "2026-10-25" });
  expect(reportRange("weekly", new Date("2026-10-25T16:00:00Z"))).toEqual({ from: "2026-10-26", to: "2026-11-01" });
});
test("calendar months preserve year, leap days and variable month length", () => {
  for (const [day, from, to] of [["2024-02-15", "2024-02-01", "2024-02-29"], ["2025-02-15", "2025-02-01", "2025-02-28"], ["2026-12-31", "2026-12-01", "2026-12-31"]]) {
    expect(reportRange("monthly", reportAnchor(day))).toEqual({ from, to });
  }
  expect(reportAnchor("2025-02-29")).toBeUndefined();
  expect(reportAnchor("invalid")).toBeUndefined();
});
test("category totals include zero categories, missing values and reconcile to records", () => {
  const summary = reportCategorySummary([{ category: "road" }, { category: "water" }, { category: "road" }, {}]);
  expect(summary.find(row => row.code === "road")?.total).toBe(2);
  expect(summary.find(row => row.code === "other")?.total).toBe(1);
  expect(summary.find(row => row.code === "gas")?.total).toBe(0);
  expect(summary.reduce((total, row) => total + row.total, 0)).toBe(4);
});
