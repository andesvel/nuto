/// <reference types="@cloudflare/vitest-plugin/types" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import schema from "../../../schema.sql?raw";
import {
  existsById,
  getLongUrlById,
  getRedirectTargetById,
  getRedirectWithExpiryById,
  findOwnedById,
  listActiveLinksForUser,
  insertLink,
  renameLink,
  updateLinkById,
  deleteLinkById,
  deleteExpiredLinks,
  deleteLinksByUser,
  getLinkUsageForUser,
} from "../urls";

describe("urls repository", () => {
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
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at)
       VALUES ('user_2', 'other@nuto.com', 'free', datetime('now'))`,
    ).run();
  });

  it("insertLink persists a link that existsById and getLongUrlById find", async () => {
    await insertLink(env.DB, {
      id: "code-1",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    expect(await existsById(env.DB, "code-1")).toBe(true);
    expect(await existsById(env.DB, "missing")).toBe(false);
    expect(await getLongUrlById(env.DB, "code-1")).toBe(
      "https://example.com",
    );
    expect(await getLongUrlById(env.DB, "missing")).toBeNull();
  });

  it("getRedirectTargetById returns the stored hash for protected links", async () => {
    await insertLink(env.DB, {
      id: "locked",
      longUrl: "https://secure.example.com",
      userId: "user_1",
      expiresAt: null,
      password: "abc123def456",
      passwordEnc: "iv.ct",
    });

    const target = await getRedirectTargetById(env.DB, "locked");
    expect(target).toEqual({
      long_url: "https://secure.example.com",
      password: "abc123def456",
    });

    const open = await insertLink(env.DB, {
      id: "open",
      longUrl: "https://open.example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    }).then(() => getRedirectTargetById(env.DB, "open"));
    expect(open).toEqual({
      long_url: "https://open.example.com",
      password: null,
    });
  });

  it("getRedirectWithExpiryById returns the stored expiry", async () => {
    await insertLink(env.DB, {
      id: "timed",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: "2030-01-01T00:00:00.000Z",
      password: null,
      passwordEnc: null,
    });

    const record = await getRedirectWithExpiryById(env.DB, "timed");
    expect(record?.long_url).toBe("https://example.com");
    expect(record?.expires_at).toBe("2030-01-01T00:00:00.000Z");
    expect(record?.password).toBeNull();
  });

  it("findOwnedById only matches rows owned by the given user", async () => {
    await insertLink(env.DB, {
      id: "mine",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    expect(await findOwnedById(env.DB, "mine", "user_1")).not.toBeNull();
    expect(await findOwnedById(env.DB, "mine", "user_2")).toBeNull();
    expect(await findOwnedById(env.DB, "missing", "user_1")).toBeNull();
  });

  it("listActiveLinksForUser returns only the user's unexpired links", async () => {
    await insertLink(env.DB, {
      id: "active",
      longUrl: "https://active.example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });
    await insertLink(env.DB, {
      id: "expired",
      longUrl: "https://expired.example.com",
      userId: "user_1",
      expiresAt: "2020-01-01T00:00:00.000Z",
      password: null,
      passwordEnc: null,
    });
    await insertLink(env.DB, {
      id: "foreign",
      longUrl: "https://foreign.example.com",
      userId: "user_2",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    const rows = await listActiveLinksForUser(env.DB, "user_1");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      shortCode: "active",
      longUrl: "https://active.example.com",
    });
  });

  it("deleteLinkById removes the row", async () => {
    await insertLink(env.DB, {
      id: "dash",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    expect(await existsById(env.DB, "dash")).toBe(true);

    await deleteLinkById(env.DB, "dash");
    expect(await existsById(env.DB, "dash")).toBe(false);
  });

  it("renameLink moves the row to the new short code", async () => {
    await insertLink(env.DB, {
      id: "old-code",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    await renameLink(env.DB, {
      newId: "new-code",
      longUrl: "https://renamed.example.com",
      password: null,
      passwordEnc: null,
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      currentId: "old-code",
      userId: "user_1",
    });

    expect(await getLongUrlById(env.DB, "old-code")).toBeNull();
    expect(await getLongUrlById(env.DB, "new-code")).toBe(
      "https://renamed.example.com",
    );
  });

  it("updateLinkById changes the stored fields for the same short code", async () => {
    await insertLink(env.DB, {
      id: "same-code",
      longUrl: "https://before.example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    await updateLinkById(env.DB, {
      longUrl: "https://after.example.com",
      password: "deadbeef",
      passwordEnc: null,
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      id: "same-code",
      userId: "user_1",
    });

    const target = await getRedirectTargetById(env.DB, "same-code");
    expect(target).toEqual({
      long_url: "https://after.example.com",
      password: "deadbeef",
    });
  });

  it("deleteExpiredLinks removes only expired links and returns their ids", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at) VALUES
        ('old', 'https://a.com', 'user_1', datetime('now'), ?),
        ('future', 'https://b.com', 'user_1', datetime('now'), ?),
        ('forever', 'https://c.com', 'user_1', datetime('now'), NULL)`,
    )
      .bind(
        new Date(Date.now() - 60_000).toISOString(),
        new Date(Date.now() + 86_400_000).toISOString(),
      )
      .run();

    expect(await deleteExpiredLinks(env.DB)).toEqual(["old"]);
    expect(await existsById(env.DB, "old")).toBe(false);
    expect(await existsById(env.DB, "future")).toBe(true);
    expect(await existsById(env.DB, "forever")).toBe(true);
  });

  it("deleteLinksByUser removes the user's links and returns their ids", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at) VALUES
        ('mine-1', 'https://a.com', 'user_1', datetime('now')),
        ('mine-2', 'https://b.com', 'user_1', datetime('now')),
        ('theirs', 'https://c.com', 'user_2', datetime('now'))`,
    ).run();

    const ids = await deleteLinksByUser(env.DB, "user_1");
    expect(ids.sort()).toEqual(["mine-1", "mine-2"]);
    expect(await existsById(env.DB, "theirs")).toBe(true);
  });

  it("updateLinkById leaves links owned by another user untouched", async () => {
    await insertLink(env.DB, {
      id: "not-mine",
      longUrl: "https://before.example.com",
      userId: "user_2",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    await updateLinkById(env.DB, {
      longUrl: "https://hijacked.example.com",
      password: null,
      passwordEnc: null,
      updatedAt: new Date().toISOString(),
      expiresAt: null,
      id: "not-mine",
      userId: "user_1",
    });

    expect(await getLongUrlById(env.DB, "not-mine")).toBe(
      "https://before.example.com",
    );
  });

  it("getLinkUsageForUser uses the settings default unless user_limits overrides it", async () => {
    await insertLink(env.DB, {
      id: "counted",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });

    expect(await getLinkUsageForUser(env.DB, "user_1")).toEqual({
      used: 1,
      limit: 50,
    });

    await env.DB.prepare(
      "INSERT OR REPLACE INTO user_limits (user_id, max_links) VALUES ('user_1', 200)",
    ).run();
    try {
      expect(await getLinkUsageForUser(env.DB, "user_1")).toEqual({
        used: 1,
        limit: 200,
      });
    } finally {
      await env.DB.prepare("DELETE FROM user_limits").run();
    }
  });

  it("listActiveLinksForUser hides ISO-dated links that expired earlier today", async () => {
    // ISO strings ("...T...Z") sort after datetime('now') ("... ...") on the
    // same day, so a plain text comparison kept these links "active".
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at) VALUES
        ('expired-today', 'https://a.com', 'user_1', datetime('now'), ?),
        ('later-today', 'https://b.com', 'user_1', datetime('now'), ?)`,
    )
      .bind(
        new Date(now - 60_000).toISOString(),
        new Date(now + 60 * 60_000).toISOString(),
      )
      .run();

    const ids = (await listActiveLinksForUser(env.DB, "user_1")).map(
      (l) => l.shortCode,
    );
    expect(ids).toEqual(["later-today"]);
  });
});
