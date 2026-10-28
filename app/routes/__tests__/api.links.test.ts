/// <reference types="@cloudflare/vitest-pool-workers" />
import { env, createExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { action } from "../api.links";
import { loader as redirectLoader } from "../redirect";
import type { ActionFunctionArgs, AppLoadContext } from "react-router";
import schema from "../../../schema.sql?raw";

// Fixed 32-byte test key so tests don't depend on .dev.vars (absent in CI)
const TEST_ENC_KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
const testEnv = { ...env, PASSCODE_ENC_KEY: TEST_ENC_KEY };

// Mock implementation of getAuth from Clerk if needed,
// but since the module might try to use the real one, we would need to mock it via vitest
// For now, we will assume we test the robust edge cases by simulating request conditions
//import * as clerk from "@clerk/react-router/ssr.server";
import { vi } from "vitest";

vi.mock("@clerk/react-router/ssr.server", () => ({
  getAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
}));

describe("Links API Endpoints (action)", () => {
  const ctx = createExecutionContext();

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
    vi.clearAllMocks();

    // Seed database with a default user
    await env.DB.prepare("DELETE FROM users").run();
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at) 
       VALUES ('user_1', 'api_test@nuto.com', 'free', datetime('now'))`,
    ).run();

    await env.DB.prepare("DELETE FROM urls").run();

    const storeKeys = await env.URL_STORE.list();
    for (const key of storeKeys.keys) {
      await env.URL_STORE.delete(key.name);
    }
  });

  it("V1: Rejects shortCode creation if it already exists in D1 (409 Conflict)", async () => {
    // Seed an existing URL
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at) 
       VALUES ('takencode', 'https://example.com', 'user_1', datetime('now'))`,
    ).run();

    const formData = new FormData();
    formData.set("longUrl", "https://new-url.com");
    formData.set("shortCode", "takencode");

    const request = new Request("http://localhost/api/links", {
      method: "POST",
      headers: new Headers({ host: "localhost" }),
      body: formData,
    });

    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: {},
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    expect(response.status).toBe(409);
    const data = (await response.json()) as { success: boolean };
    expect(data.success).toBe(false);
  });

  // Limit check cannot easily be tested here if MAX_LINKS_PER_USER is missing from mock env,
  // but we can test the general error handling
  it("V2: Deletes a link only if it belongs to the requesting user", async () => {
    // Insert a URL owned by 'user_2'
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at) 
       VALUES ('user_2', 'other@nuto.com', 'free', datetime('now'))`,
    ).run();

    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at) 
       VALUES ('foreign-code', 'https://example.com', 'user_2', datetime('now'))`,
    ).run();

    // The mock is set to return userId: 'user_1'
    const request = new Request(
      "http://localhost/api/links?shortCode=foreign-code",
      {
        method: "DELETE",
        headers: new Headers({ host: "localhost" }),
      },
    );

    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: {},
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    // Should return 404 or 403 because user_1 does not own 'foreign-code'
    expect(response.status).toBe(404);
  });

  it("V3: Keeps the password wall on KV hits after editing a protected link", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, password)
       VALUES ('locked', 'https://example.com', 'user_1', datetime('now'), 'oldhash')`,
    ).run();

    const formData = new FormData();
    formData.set("shortCode", "locked");
    formData.set("originalShortCode", "locked");
    formData.set("longUrl", "https://edited.example.com");
    formData.set("password", "new-secret");

    const response = (await action({
      request: new Request("http://localhost/api/links", {
        method: "PUT",
        headers: new Headers({ host: "localhost" }),
        body: formData,
      }),
      params: {},
      context: { cloudflare: { env: testEnv, ctx } } as unknown as AppLoadContext,
    } as unknown as ActionFunctionArgs)) as Response;
    expect(response.status).toBe(200);

    const cached = JSON.parse((await env.URL_STORE.get("locked")) as string);
    expect(cached.hasPassword).toBe(true);
    expect(cached.passwordFingerprint).toBeTruthy();
    expect(JSON.stringify(cached)).not.toContain("oldhash");

    const visit = (await redirectLoader({
      request: new Request("http://localhost/locked", {
        headers: new Headers({ host: "localhost" }),
      }),
      params: { slug: "locked" },
      context: { cloudflare: { env: testEnv, ctx } } as unknown as AppLoadContext,
    })) as Response;
    const data = (await visit.json()) as { requiresPassword?: boolean };
    expect(data.requiresPassword).toBe(true);
  });

  describe("V4: input validation happens before any write", () => {
    async function create(fields: Record<string, string>) {
      const formData = new FormData();
      for (const [k, v] of Object.entries(fields)) formData.set(k, v);
      return (await action({
        request: new Request("http://localhost/api/links", {
          method: "POST",
          headers: new Headers({ host: "localhost" }),
          body: formData,
        }),
        params: {},
        context: { cloudflare: { env: testEnv, ctx } } as unknown as AppLoadContext,
      } as unknown as ActionFunctionArgs)) as Response;
    }

    async function countLinks() {
      const row = (await env.DB.prepare("SELECT COUNT(*) AS c FROM urls").first()) as {
        c: number;
      };
      return row.c;
    }

    it.each([
      ["a non-http scheme", { shortCode: "badscheme", longUrl: "javascript:alert(1)" }],
      ["an oversized short code", { shortCode: "a".repeat(65), longUrl: "https://a.com" }],
      ["an invalid expiration", { shortCode: "baddate", longUrl: "https://a.com", expiresAt: "nope" }],
      [
        "a past expiration",
        {
          shortCode: "pastdate",
          longUrl: "https://a.com",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        },
      ],
      ["an oversized password", { shortCode: "bigpass", longUrl: "https://a.com", password: "a".repeat(129) }],
    ])("rejects %s with 400 and writes nothing", async (_label, fields) => {
      const response = await create(fields);

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBeTruthy();
      expect(await countLinks()).toBe(0);
      expect((await env.URL_STORE.list()).keys).toHaveLength(0);
    });

    it("stores the normalized URL", async () => {
      const response = await create({ shortCode: "normal", longUrl: " example.com/x " });

      expect(response.status).toBe(201);
      const row = (await env.DB.prepare(
        "SELECT long_url FROM urls WHERE id = 'normal'",
      ).first()) as { long_url: string };
      expect(row.long_url).toBe("http://example.com/x");
    });
  });

  it("V5: Rejects mutations sent from another origin", async () => {
    const formData = new FormData();
    formData.set("shortCode", "csrf");
    formData.set("longUrl", "https://a.com");

    const response = (await action({
      request: new Request("http://localhost/api/links", {
        method: "POST",
        headers: new Headers({ host: "localhost", origin: "https://evil.example" }),
        body: formData,
      }),
      params: {},
      context: { cloudflare: { env: testEnv, ctx } } as unknown as AppLoadContext,
    } as unknown as ActionFunctionArgs)) as Response;

    expect(response.status).toBe(403);
    const row = await env.DB.prepare("SELECT id FROM urls WHERE id = 'csrf'").first();
    expect(row).toBeNull();
  });
});
