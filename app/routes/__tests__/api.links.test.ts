/// <reference types="@cloudflare/vitest-pool-workers" />
import { env, createExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { action } from "../api.links";
import type { ActionFunctionArgs, AppLoadContext } from "react-router";
import schema from "../../../schema.sql?raw";

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
      cloudflare: { env, ctx },
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
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: {},
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    // Should return 404 or 403 because user_1 does not own 'foreign-code'
    expect(response.status).toBe(404);
  });
});
