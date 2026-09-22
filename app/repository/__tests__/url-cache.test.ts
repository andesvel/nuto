/// <reference types="@cloudflare/vitest-pool-workers" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import {
  getRedirectEntry,
  putRedirectEntry,
  deleteRedirectEntry,
} from "../url-cache";

describe("url-cache repository", () => {
  beforeEach(async () => {
    await env.URL_STORE.delete("cache-slug");
    await env.URL_STORE.delete("legacy-slug");
  });

  it("putRedirectEntry and getRedirectEntry round-trip an entry with storedHash", async () => {
    await putRedirectEntry(env.URL_STORE, "cache-slug", {
      longUrl: "https://example.com",
      hasPassword: true,
      storedHash: "abc123",
    });

    const entry = await getRedirectEntry(env.URL_STORE, "cache-slug");
    expect(entry).toEqual({
      longUrl: "https://example.com",
      hasPassword: true,
      storedHash: "abc123",
    });
  });

  it("getRedirectEntry returns null on a cache miss", async () => {
    expect(await getRedirectEntry(env.URL_STORE, "missing")).toBeNull();
  });

  it("getRedirectEntry falls back to the raw string for legacy non-JSON values", async () => {
    await env.URL_STORE.put("legacy-slug", "https://legacy.example.com");

    const entry = await getRedirectEntry(env.URL_STORE, "legacy-slug");
    expect(entry).toEqual({
      longUrl: "https://legacy.example.com",
      hasPassword: false,
      storedHash: null,
    });
  });

  it("getRedirectEntry falls back to the raw string for JSON without longUrl", async () => {
    await env.URL_STORE.put("legacy-slug", '{"unexpected":"shape"}');

    const entry = await getRedirectEntry(env.URL_STORE, "legacy-slug");
    expect(entry).toEqual({
      longUrl: '{"unexpected":"shape"}',
      hasPassword: false,
      storedHash: null,
    });
  });

  it("deleteRedirectEntry removes the cached entry", async () => {
    await putRedirectEntry(env.URL_STORE, "cache-slug", {
      longUrl: "https://example.com",
      hasPassword: false,
    });

    await deleteRedirectEntry(env.URL_STORE, "cache-slug");

    expect(await getRedirectEntry(env.URL_STORE, "cache-slug")).toBeNull();
  });
});
