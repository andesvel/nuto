/// <reference types="@cloudflare/vitest-pool-workers" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import {
  getRedirectEntry,
  putRedirectEntry,
  deleteRedirectEntry,
  redirectCacheOptions,
  isExpired,
  REDIRECT_CACHE_TTL,
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
      expiresAt: null,
    });
  });

  it("getRedirectEntry returns null on a cache miss", async () => {
    expect(await getRedirectEntry(env.URL_STORE, "missing")).toBeNull();
  });

  it("getRedirectEntry treats legacy non-JSON values as a miss", async () => {
    await env.URL_STORE.put("legacy-slug", "https://legacy.example.com");

    expect(await getRedirectEntry(env.URL_STORE, "legacy-slug")).toBeNull();
  });

  it("getRedirectEntry treats JSON written without expiresAt as a miss", async () => {
    await env.URL_STORE.put(
      "legacy-slug",
      JSON.stringify({ longUrl: "https://legacy.example.com", hasPassword: false }),
    );

    expect(await getRedirectEntry(env.URL_STORE, "legacy-slug")).toBeNull();
  });

  it("putRedirectEntry round-trips expiresAt", async () => {
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    await putRedirectEntry(env.URL_STORE, "cache-slug", {
      longUrl: "https://example.com",
      hasPassword: false,
      expiresAt,
    });

    const entry = await getRedirectEntry(env.URL_STORE, "cache-slug");
    expect(entry?.expiresAt).toBe(expiresAt);
  });

  it("deleteRedirectEntry removes the cached entry", async () => {
    await putRedirectEntry(env.URL_STORE, "cache-slug", {
      longUrl: "https://example.com",
      hasPassword: false,
    });

    await deleteRedirectEntry(env.URL_STORE, "cache-slug");

    expect(await getRedirectEntry(env.URL_STORE, "cache-slug")).toBeNull();
  });

  describe("redirectCacheOptions", () => {
    const now = Date.UTC(2026, 0, 1);
    const nowSeconds = now / 1000;

    it("uses the default TTL for links without expiration", () => {
      expect(redirectCacheOptions(null, now)).toEqual({
        expirationTtl: REDIRECT_CACHE_TTL,
      });
    });

    it("expires the entry together with the link", () => {
      const expiresAt = new Date(now + 2 * 86_400_000).toISOString();
      expect(redirectCacheOptions(expiresAt, now)).toEqual({
        expiration: nowSeconds + 2 * 86_400,
      });
    });

    it("caps the entry at the default TTL for far-future links", () => {
      const expiresAt = new Date(now + 365 * 86_400_000).toISOString();
      expect(redirectCacheOptions(expiresAt, now)).toEqual({
        expiration: nowSeconds + REDIRECT_CACHE_TTL,
      });
    });

    it("respects the KV 60-second floor for links about to expire", () => {
      const expiresAt = new Date(now + 5_000).toISOString();
      expect(redirectCacheOptions(expiresAt, now)).toEqual({
        expiration: nowSeconds + 60,
      });
    });
  });

  describe("isExpired", () => {
    it("is false without expiration and true once the date has passed", () => {
      const now = Date.now();
      expect(isExpired(null, now)).toBe(false);
      expect(isExpired(new Date(now + 1000).toISOString(), now)).toBe(false);
      expect(isExpired(new Date(now - 1000).toISOString(), now)).toBe(true);
    });
  });
});
