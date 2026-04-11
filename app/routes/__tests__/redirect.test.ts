/// <reference types="@cloudflare/vitest-pool-workers" />
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { loader, action } from "../redirect";
import type { AppLoadContext, ActionFunctionArgs } from "react-router";
import schema from "../../../schema.sql?raw";

describe("Redirect Edge Logic", () => {
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
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at) 
       VALUES ('user_1', 'test@nuto.com', 'free', datetime('now'))`,
    ).run();
    await env.URL_STORE.delete("test-slug");
  });

  it("It should return 410 and clear D1 if the entry has expired", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at) 
       VALUES ('test-slug', 'https://example.com', 'user_1', datetime('now'), datetime('now', '-1 day'))`,
    ).run();

    const request = new Request("http://localhost/test-slug", {
      headers: new Headers({ host: "localhost" }),
    });

    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    try {
      await loader({
        request,
        params: { slug: "test-slug" },
        context: mockContext,
      });
      expect.unreachable("The loader ignored interrupt 410");
    } catch (response: unknown) {
      expect(response).toBeInstanceOf(Response);
      expect((response as Response).status).toBe(410);
    }

    await waitOnExecutionContext(ctx);

    const dbCheck = await env.DB.prepare(
      "SELECT id FROM urls WHERE id = 'test-slug'",
    ).first();
    expect(dbCheck).toBeNull();
  });

  it("V1: It must resolve from the cache by returning a 302 response without checking the expiration time in D1", async () => {
    await env.URL_STORE.put(
      "kv-cache-hit",
      JSON.stringify({ longUrl: "https://kv-hit.com", hasPassword: false }),
    );

    const request = new Request("http://localhost/kv-cache-hit", {
      headers: new Headers({ host: "localhost" }),
    });

    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request,
      params: { slug: "kv-cache-hit" },
      context: mockContext,
    })) as Response;

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://kv-hit.com");
  });

  it("V2: Detects and breaks network loops by returning a 404 error", async () => {
    await env.DB.prepare(
      `
      INSERT INTO urls (id, long_url, user_id, created_at)
      VALUES 
        ('loop-1', 'http://localhost/loop-2', 'user_1', datetime('now')),
        ('loop-2', 'http://localhost/loop-1', 'user_1', datetime('now'))
    `,
    ).run();

    const request = new Request("http://localhost/loop-1", {
      headers: new Headers({ host: "localhost" }),
    });
    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    try {
      await loader({
        request,
        params: { slug: "loop-1" },
        context: mockContext,
      });
      expect.unreachable(
        "The loader failed to break out of the infinite recursion loop",
      );
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(404);
    }
  });

  it("V3: Returns JSON from `requiresPassword` if no cookie is present", async () => {
    const rawPwd = "secret-cake";
    const pwdHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawPwd),
    );
    const hashHex = [...new Uint8Array(pwdHash)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await env.DB.prepare(
      `
      INSERT INTO urls (id, long_url, user_id, created_at, password)
      VALUES ('wall-1', 'https://secure.com', 'user_1', datetime('now'), ?)
    `,
    )
      .bind(hashHex)
      .run();

    const request = new Request("http://localhost/wall-1", {
      headers: new Headers({ host: "localhost" }),
    });
    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request,
      params: { slug: "wall-1" },
      context: mockContext,
    })) as Response;

    expect(response).toBeInstanceOf(Response);
    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((data as any).requiresPassword).toBe(true);
  });

  it("V4: Validate the password via POST and return a 302 response with a Set-Cookie JWT header", async () => {
    const rawPwd = "secret-cake";
    const pwdHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawPwd),
    );
    const hashHex = [...new Uint8Array(pwdHash)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await env.DB.prepare(
      `
      INSERT INTO urls (id, long_url, user_id, created_at, password)
      VALUES ('wall-bypass', 'https://bypassed.com', 'user_1', datetime('now'), ?)
    `,
    )
      .bind(hashHex)
      .run();

    const formData = new FormData();
    formData.set("password", rawPwd);

    const request = new Request("http://localhost/wall-bypass", {
      method: "POST",
      headers: new Headers({ host: "localhost" }),
      body: formData,
    });

    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: { slug: "wall-bypass" },
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    expect(response).toBeInstanceOf(Response);
    // Acción exitosa devuelve redirect 302
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://bypassed.com");
    expect(response.headers.get("Set-Cookie")).toContain("pw_wall-bypass=");
  });

  it("V5: Records clicks asynchronously without blocking the response", async () => {
    await env.DB.prepare(
      `
      INSERT INTO urls (id, long_url, user_id, created_at)
      VALUES ('track-me', 'https://track.com', 'user_1', datetime('now'))
    `,
    ).run();

    const request = new Request("http://localhost/track-me", {
      headers: new Headers({
        host: "localhost",
        "user-agent": "Vitest/1.0",
      }),
    });

    const mockContext = {
      cloudflare: { env, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request,
      params: { slug: "track-me" },
      context: mockContext,
    })) as Response;

    expect(response.status).toBe(302);

    // Drain microtasks so that `context.waitUntil` can complete its asynchronous execution
    await waitOnExecutionContext(ctx);

    const clickRecord = await env.DB.prepare(
      "SELECT user_agent FROM clicks WHERE url_id = 'track-me'",
    ).first();

    expect(clickRecord).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((clickRecord as any).user_agent).toBe("Vitest/1.0");

    const urlRecord = await env.DB.prepare(
      "SELECT last_clicked FROM urls WHERE id = 'track-me'",
    ).first();

    expect(urlRecord).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((urlRecord as any).last_clicked).not.toBeNull();
  });
});
