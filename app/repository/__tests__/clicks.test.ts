/// <reference types="@cloudflare/vitest-pool-workers" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import schema from "../../../schema.sql?raw";
import { insertClick, updateLastClicked } from "../clicks";
import { insertLink } from "../urls";

describe("clicks repository", () => {
  beforeAll(async () => {
    const cleanSchema = schema
      .replace(/--.*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/PRAGMA[^;]*;/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    await env.DB.exec(cleanSchema);
  });

  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM urls").run();
    await env.DB.prepare("DELETE FROM users").run();
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at)
       VALUES ('user_1', 'owner@nuto.com', 'free', datetime('now'))`,
    ).run();
  });

  it("insertClick stores only the privacy-safe fields (no IP)", async () => {
    await insertLink(env.DB, {
      id: "track-1",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    await insertClick(env.DB, {
      urlId: "track-1",
      country: "MX",
      userAgent: "UA/1",
    });
    await insertClick(env.DB, {
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

  it("updateLastClicked stamps the link's last_clicked", async () => {
    await insertLink(env.DB, {
      id: "stamp-1",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    await updateLastClicked(env.DB, "stamp-1");

    const row = await env.DB
      .prepare("SELECT last_clicked FROM urls WHERE id = 'stamp-1'")
      .first<{ last_clicked: string | null }>();
    expect(row?.last_clicked).not.toBeNull();
  });
});
