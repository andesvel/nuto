/// <reference types="@cloudflare/vitest-plugin/types" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { applySchema } from "../../../test/helpers";
import { getAnalytics, getLiveActivity, sqlDateTime } from "../analytics";

const NOW = new Date("2026-10-20T12:00:00Z");
const ago = (ms: number) => sqlDateTime(new Date(NOW.getTime() - ms));
const H = 3_600_000;
const D = 24 * H;

async function link(id: string, userId: string, createdAt: string) {
  await env.DB.prepare(
    "INSERT INTO urls (id, long_url, user_id, created_at) VALUES (?, 'https://example.com', ?, ?)",
  )
    .bind(id, userId, createdAt)
    .run();
}

async function click(
  urlId: string,
  clickedAt: string,
  extra: { country?: string; source?: string; app?: string; device?: string } = {},
) {
  await env.DB.prepare(
    "INSERT INTO clicks (url_id, clicked_at, country, source, app, device) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      urlId,
      clickedAt,
      extra.country ?? null,
      extra.source ?? null,
      extra.app ?? null,
      extra.device ?? null,
    )
    .run();
}

describe("analytics repository", () => {
  beforeAll(async () => {
    await applySchema(env.DB);
  });

  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM clicks").run();
    await env.DB.prepare("DELETE FROM urls").run();
    await env.DB.prepare("DELETE FROM users").run();
    for (const id of ["user_1", "user_2"]) {
      await env.DB.prepare(
        "INSERT INTO users (id, email, subscription_plan, created_at) VALUES (?, ?, 'free', datetime('now'))",
      )
        .bind(id, `${id}@nuto.com`)
        .run();
    }
    await link("aaa", "user_1", ago(3 * D));
    await link("bbb", "user_1", ago(40 * D));
    await link("other", "user_2", ago(1 * D));

    await click("aaa", ago(1 * H), { country: "CO", app: "instagram", device: "ios", source: "qr" });
    await click("aaa", ago(2 * H), { country: "CO", app: "instagram", device: "ios" });
    await click("aaa", ago(26 * H), { country: "MX", device: "android" });
    await click("bbb", ago(3 * D), { country: "US", device: "desktop" });
    // Outside 7 days, inside the "previous" 7 days
    await click("bbb", ago(10 * D), { country: "US", device: "desktop" });
    // Someone else's link never leaks in
    await click("other", ago(1 * H), { country: "BR", device: "ios" });
  });

  it("totals, previous period and breakdowns for 7 days", async () => {
    const data = await getAnalytics(env.DB, { userId: "user_1", range: "7d", now: NOW });
    expect(data.totals).toEqual({
      clicks: 4,
      previousClicks: 1,
      activeLinks: 2,
      linksCreated: 1,
      qrScans: 1,
    });
    expect(data.topLinks).toEqual([
      { key: "aaa", clicks: 3 },
      { key: "bbb", clicks: 1 },
    ]);
    expect(data.countries[0]).toEqual({ key: "CO", clicks: 2 });
    expect(data.apps).toContainEqual({ key: "instagram", clicks: 2 });
    expect(data.apps).toContainEqual({ key: null, clicks: 2 });
    expect(data.devices).toContainEqual({ key: "ios", clicks: 2 });
    expect(data.series.granularity).toBe("hour");
    expect(data.series.buckets.reduce((n, b) => n + b.clicks, 0)).toBe(4);
    expect(data.hours.reduce((n, b) => n + b.clicks, 0)).toBe(4);
  });

  it("all time uses daily buckets and has no previous period", async () => {
    const data = await getAnalytics(env.DB, { userId: "user_1", range: "all", now: NOW });
    expect(data.totals.clicks).toBe(5);
    expect(data.totals.previousClicks).toBeNull();
    expect(data.totals.linksCreated).toBe(2);
    expect(data.series.granularity).toBe("day");
    expect(data.series.buckets[0].key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("filters to one link", async () => {
    const data = await getAnalytics(env.DB, {
      userId: "user_1",
      range: "30d",
      link: "aaa",
      now: NOW,
    });
    expect(data.totals.clicks).toBe(3);
    expect(data.topLinks).toEqual([{ key: "aaa", clicks: 3 }]);
  });

  it("live activity covers only the last hour of the user's links", async () => {
    await click("aaa", ago(5 * 60_000), { country: "CO", app: "tiktok", device: "android" });
    const live = await getLiveActivity(env.DB, { userId: "user_1", now: NOW });
    expect(live.recent.map((c) => c.shortCode)).toEqual(["aaa"]);
    expect(live.recent[0]).toMatchObject({ app: "tiktok", device: "android" });
    expect(live.recent[0].clickedAt).toMatch(/Z$/);
    expect(live.perMinute.reduce((n, b) => n + b.clicks, 0)).toBe(1);
  });
});
