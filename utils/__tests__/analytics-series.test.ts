import { describe, it, expect } from "vitest";
import {
  clicksByLocalDay,
  clicksByLocalHour,
  niceMax,
  percentChange,
} from "../analytics-series";

describe("clicksByLocalDay", () => {
  it("regroups UTC hours into the viewer's days and fills empty days", () => {
    // Bogotá is UTC-5 (getTimezoneOffset = 300)
    const points = clicksByLocalDay(
      [
        { key: "2026-10-20T03", clicks: 2 }, // 22:00 on the 19th in Bogotá
        { key: "2026-10-20T15", clicks: 1 },
      ],
      { from: "2026-10-18T12:00:00Z", to: "2026-10-20T20:00:00Z", offsetMinutes: 300 },
    );
    expect(points.map((p) => [p.key, p.clicks])).toEqual([
      ["2026-10-18", 0],
      ["2026-10-19", 2],
      ["2026-10-20", 1],
    ]);
  });

  it("starts all-time series at the first day with clicks and groups long spans by week", () => {
    const points = clicksByLocalDay(
      [
        { key: "2026-01-01", clicks: 3 },
        { key: "2026-10-20", clicks: 1 },
      ],
      { from: null, to: "2026-10-20T12:00:00Z", offsetMinutes: 0 },
    );
    expect(points[0]).toMatchObject({ key: "2026-01-01", clicks: 3 });
    expect(points.length).toBeLessThan(60);
    expect(points.reduce((n, p) => n + p.clicks, 0)).toBe(4);
  });
});

describe("clicksByLocalHour", () => {
  it("shifts UTC hours into local time, wrapping around midnight", () => {
    const hours = clicksByLocalHour(
      [
        { key: "03", clicks: 2 },
        { key: "15", clicks: 1 },
      ],
      300,
    );
    expect(hours[22]).toBe(2);
    expect(hours[10]).toBe(1);
    expect(hours.reduce((a, b) => a + b, 0)).toBe(3);
  });
});

describe("helpers", () => {
  it("computes the change against the previous period", () => {
    expect(percentChange(15, 10)).toBe(50);
    expect(percentChange(5, 10)).toBe(-50);
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(5, null)).toBeNull();
  });

  it("rounds axis maximums to readable numbers", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(3)).toBe(3);
    expect(niceMax(7)).toBe(10);
    expect(niceMax(13)).toBe(20);
    expect(niceMax(420)).toBe(500);
  });
});
