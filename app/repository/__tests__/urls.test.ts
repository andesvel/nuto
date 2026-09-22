/// <reference types="@cloudflare/vitest-pool-workers" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import schema from "../../../schema.sql?raw";
import {
  existsById,
  getLongUrlById,
  getRedirectTargetById,
  getRedirectWithExpiryById,
  findOwnedById,
  getLinkDetailsByIdAndUser,
  listActiveLinksForUser,
  insertLink,
  insertLinkWithCreatedAt,
  renameLink,
  updateLinkById,
  deleteLinkById,
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

  it("getLinkDetailsByIdAndUser counts clicks and enforces ownership", async () => {
    await insertLink(env.DB, {
      id: "popular",
      longUrl: "https://example.com",
      userId: "user_1",
      expiresAt: null,
      password: null,
      passwordEnc: null,
    });
    await env.DB
      .prepare(
        "INSERT INTO clicks (url_id, clicked_at, country, user_agent) VALUES ('popular', datetime('now'), NULL, 'UA/1')",
      )
      .run();
    await env.DB
      .prepare(
        "INSERT INTO clicks (url_id, clicked_at, country, user_agent) VALUES ('popular', datetime('now'), NULL, 'UA/2')",
      )
      .run();

    const details = await getLinkDetailsByIdAndUser(env.DB, "popular", "user_1");
    expect(details).toMatchObject({
      shortCode: "popular",
      longUrl: "https://example.com",
      clicks: 2,
    });
    expect(await getLinkDetailsByIdAndUser(env.DB, "popular", "user_2")).toBeNull();
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

  it("insertLinkWithCreatedAt and deleteLinkById create and remove rows", async () => {
    await insertLinkWithCreatedAt(env.DB, {
      id: "dash",
      longUrl: "https://example.com",
      userId: "user_1",
      createdAt: "2024-05-01T00:00:00.000Z",
      password: null,
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
    });

    const target = await getRedirectTargetById(env.DB, "same-code");
    expect(target).toEqual({
      long_url: "https://after.example.com",
      password: "deadbeef",
    });
  });
});
