/// <reference types="@cloudflare/vitest-plugin/types" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { applySchema } from "../../../test/helpers";
import { recordClick } from "../clicks";
import { insertLink, listActiveLinksForUser } from "../urls";

describe("clicks repository", () => {
  beforeAll(async () => {
    await applySchema(env.DB);
  });

  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM urls").run();
    await env.DB.prepare("DELETE FROM users").run();
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at)
       VALUES ('user_1', 'owner@nuto.com', 'free', datetime('now'))`,
    ).run();
  });

  it("recordClick stores only the privacy-safe fields (no IP)", async () => {
    await insertLink(env.DB, {
      id: "track-1",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    await recordClick(env.DB, {
      urlId: "track-1",
      country: "MX",
      userAgent: "UA/1",
    });
    await recordClick(env.DB, {
      urlId: "track-1",
      country: null,
      userAgent: "UA/2",
    });

    const rows = (await env.DB
      .prepare("SELECT * FROM clicks WHERE url_id = 'track-1'")
      .all()) as unknown as {
      results: Array<Record<string, unknown>>;
    };

    expect(rows.results).toHaveLength(2);
    for (const row of rows.results) {
      expect(Object.keys(row).sort()).toEqual([
        "clicked_at",
        "country",
        "id",
        "url_id",
        "user_agent",
      ]);
    }
    expect(rows.results[0]).toMatchObject({
      url_id: "track-1",
      country: "MX",
      user_agent: "UA/1",
    });
    expect(rows.results[1]).toMatchObject({
      url_id: "track-1",
      country: null,
      user_agent: "UA/2",
    });
  });

  it("recordClick stamps last_clicked and keeps click_count in sync", async () => {
    await insertLink(env.DB, {
      id: "stamp-1",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    for (let i = 0; i < 3; i++) {
      await recordClick(env.DB, { urlId: "stamp-1", country: null, userAgent: "UA" });
    }

    const row = await env.DB
      .prepare("SELECT last_clicked, click_count FROM urls WHERE id = 'stamp-1'")
      .first<{ last_clicked: string | null; click_count: number }>();
    expect(row?.last_clicked).not.toBeNull();
    expect(row?.click_count).toBe(3);

    const [link] = await listActiveLinksForUser(env.DB, "user_1");
    expect(link.clicks).toBe(3);
  });
});
