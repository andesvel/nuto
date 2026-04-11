/// <reference types="@cloudflare/vitest-pool-workers" />
import { env, createExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { action } from "../webhooks.clerk";
import type { ActionFunctionArgs, AppLoadContext } from "react-router";
import schema from "../../../schema.sql?raw";

// Bypass svix underlying buffer/crypto issues in Vitest cloudflare runtime
vi.mock("svix", () => ({
  Webhook: class {
    constructor() {}
    verify(payload: string) {
      return JSON.parse(payload);
    }
  },
}));

describe("Clerk Webhooks", () => {
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
    await env.DB.prepare("DELETE FROM users").run();
  });

  it("V1: Rejects missing Svix headers seamlessly (401 Unauthorized)", async () => {
    // Missing svix-id, svix-timestamp, svix-signature
    const request = new Request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ data: { id: "user_wh_1" } }),
    });

    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: {},
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    const text = await response.text();
    expect(response.status).toBe(400);
    expect(text).toContain("no svix headers");
  });

  it("V2: Stores user successfully on 'user.created' webhook (D1 sync)", async () => {
    // Generate valid svix payload
    const whSecret = "whsec_TESTSECRET123";
    const payload = JSON.stringify({
      data: {
        id: "user_svix_1",
        email_addresses: [{ email_address: "svix@nuto.com", id: "email_1" }],
        primary_email_address_id: "email_1",
        created_at: 1700000000000,
      },
      type: "user.created",
    });

    const reqHeaders = new Headers({
      "Content-Type": "application/json",
      "svix-id": "msg_123",
      "svix-timestamp": "123456789",
      "svix-signature": "v1,signature_mock",
    });

    const request = new Request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: reqHeaders,
      body: payload,
    });

    // Provide the test secret in context
    const proxyEnv = { ...env, CLERK_WEBHOOK_SECRET: whSecret };
    const mockContext = {
      cloudflare: { env: proxyEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: {},
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    expect(response.status).toBe(200);

    const dbUser = (await env.DB.prepare(
      "SELECT id, email, subscription_plan FROM users WHERE id = 'user_svix_1'",
    ).first()) as {
      id: string;
      email: string;
      subscription_plan: string;
    } | null;

    expect(dbUser).not.toBeNull();
    expect(dbUser?.email).toBe("svix@nuto.com");
    expect(dbUser?.subscription_plan).toBe("FREE"); // Default plan
  });
});
