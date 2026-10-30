/// <reference types="@cloudflare/vitest-plugin/types" />
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { loader } from "../redirect";
import { loader as gateLoader, action } from "../link-gate";
import type {
  AppLoadContext,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import { applySchema, TEST_ENC_KEY } from "../../../test/helpers";

const testEnv = { ...env, PASSCODE_ENC_KEY: TEST_ENC_KEY };

async function expectGateStatus(
  slug: string,
  context: AppLoadContext,
  status: number,
) {
  try {
    await gateLoader({
      request: new Request(`http://localhost/p/${slug}`),
      params: { slug },
      context,
    } as unknown as LoaderFunctionArgs);
    expect.unreachable(`The gate didn't answer ${status}`);
  } catch (response: unknown) {
    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(status);
  }
}

describe("Redirect Edge Logic", () => {
  const ctx = createExecutionContext();

  beforeAll(async () => {
    await applySchema(env.DB);
  });

  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM users").run();
    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_plan, created_at) 
       VALUES ('user_1', 'test@nuto.com', 'free', datetime('now'))`,
    ).run();
    await env.URL_STORE.delete("test-slug");
  });

  it("Sends expired links to the gate, which answers 410", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at) 
       VALUES ('test-slug', 'https://example.com', 'user_1', datetime('now'), datetime('now', '-1 day'))`,
    ).run();

    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request: new Request("http://localhost/test-slug", {
        headers: new Headers({ host: "localhost" }),
      }),
      params: { slug: "test-slug" },
      context: mockContext,
    })) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/p/test-slug");

    await expectGateStatus("test-slug", mockContext, 410);
  });

  it("V1: It must resolve from the cache by returning a 302 response without checking the expiration time in D1", async () => {
    await env.URL_STORE.put(
      "kv-cache-hit",
      JSON.stringify({
        v: 2,
        longUrl: "https://kv-hit.com",
        hasPassword: false,
        expiresAt: null,
      }),
    );

    const request = new Request("http://localhost/kv-cache-hit", {
      headers: new Headers({ host: "localhost" }),
    });

    const mockContext = {
      cloudflare: { env: testEnv, ctx },
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

  it("Drops expired KV hits and lets the gate answer 410", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at)
       VALUES ('kv-expired', 'https://example.com', 'user_1', datetime('now'), ?)`,
    )
      .bind(new Date(Date.now() - 60_000).toISOString())
      .run();
    await env.URL_STORE.put(
      "kv-expired",
      JSON.stringify({
        v: 2,
        longUrl: "https://example.com",
        hasPassword: false,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    );

    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request: new Request("http://localhost/kv-expired", {
        headers: new Headers({ host: "localhost" }),
      }),
      params: { slug: "kv-expired" },
      context: mockContext,
    })) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/p/kv-expired");

    await waitOnExecutionContext(ctx);
    expect(await env.URL_STORE.get("kv-expired")).toBeNull();
    await expectGateStatus("kv-expired", mockContext, 410);
  });

  it("Sends unknown slugs to the gate, which answers 404", async () => {
    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request: new Request("http://localhost/nope", {
        headers: new Headers({ host: "localhost" }),
      }),
      params: { slug: "nope" },
      context: mockContext,
    })) as Response;
    expect(response.headers.get("Location")).toBe("/p/nope");

    await expectGateStatus("nope", mockContext, 404);
  });

  it("Repopulates KV from D1 with the link's expiration", async () => {
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at)
       VALUES ('kv-repop', 'https://example.com', 'user_1', datetime('now'), ?)`,
    )
      .bind(expiresAt)
      .run();

    const request = new Request("http://localhost/kv-repop", {
      headers: new Headers({ host: "localhost" }),
    });
    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request,
      params: { slug: "kv-repop" },
      context: mockContext,
    })) as Response;
    expect(response.status).toBe(302);

    await waitOnExecutionContext(ctx);
    const cached = await env.URL_STORE.getWithMetadata("kv-repop");
    expect(JSON.parse(cached.value as string).expiresAt).toBe(expiresAt);
  });

  it("Rejects the password form with 410 once the link has expired", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at, password)
       VALUES ('wall-expired', 'https://example.com', 'user_1', datetime('now'), ?, 'hash')`,
    )
      .bind(new Date(Date.now() - 60_000).toISOString())
      .run();

    const formData = new FormData();
    formData.set("password", "anything");
    const request = new Request("http://localhost/wall-expired", {
      method: "POST",
      headers: new Headers({ host: "localhost" }),
      body: formData,
    });
    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await action({
      request,
      params: { slug: "wall-expired" },
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;

    expect(response.status).toBe(410);
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
      cloudflare: { env: testEnv, ctx },
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

  it("V3: Sends protected links without a cookie to the password wall", async () => {
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

    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const response = (await loader({
      request: new Request("http://localhost/wall-1", {
        headers: new Headers({ host: "localhost" }),
      }),
      params: { slug: "wall-1" },
      context: mockContext,
    })) as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/p/wall-1");

    // The gate renders the wall for it
    const gate = await gateLoader({
      request: new Request("http://localhost/p/wall-1"),
      params: { slug: "wall-1" },
      context: mockContext,
    } as unknown as LoaderFunctionArgs);
    expect(gate).toEqual({ slug: "wall-1" });
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
      cloudflare: { env: testEnv, ctx },
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

  it("Lets the password cookie through on the next visit, and rejects forged ones", async () => {
    const rawPwd = "secret-cake";
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawPwd),
    );
    const hashHex = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, password)
       VALUES ('wall-cookie', 'https://secure.com', 'user_1', datetime('now'), ?)`,
    )
      .bind(hashHex)
      .run();
    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const formData = new FormData();
    formData.set("password", rawPwd);
    const post = (await action({
      request: new Request("http://localhost/wall-cookie", {
        method: "POST",
        headers: new Headers({ host: "localhost" }),
        body: formData,
      }),
      params: { slug: "wall-cookie" },
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;
    const cookie = (post.headers.get("Set-Cookie") ?? "").split(";")[0];

    const visit = (cookieHeader: string) =>
      loader({
        request: new Request("http://localhost/wall-cookie", {
          headers: new Headers({ host: "localhost", cookie: cookieHeader }),
        }),
        params: { slug: "wall-cookie" },
        context: mockContext,
      }) as Promise<Response>;

    const authed = await visit(cookie);
    expect(authed.status).toBe(302);
    expect(authed.headers.get("Location")).toBe("https://secure.com");

    // The old verifier (first 16 chars of the hash) no longer works
    const forged = await visit(`pw_wall-cookie=${hashHex.slice(0, 16)}`);
    expect(forged.headers.get("Location")).toBe("/p/wall-cookie");
  });

  it("Upgrades a legacy SHA-256 hash to PBKDF2 on a successful unlock", async () => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode("legacy-pass"),
    );
    const hashHex = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, password)
       VALUES ('wall-upgrade', 'https://secure.com', 'user_1', datetime('now'), ?)`,
    )
      .bind(hashHex)
      .run();
    const mockContext = {
      cloudflare: { env: testEnv, ctx },
    } as unknown as AppLoadContext;

    const formData = new FormData();
    formData.set("password", "legacy-pass");
    const post = (await action({
      request: new Request("http://localhost/wall-upgrade", {
        method: "POST",
        headers: new Headers({ host: "localhost" }),
        body: formData,
      }),
      params: { slug: "wall-upgrade" },
      context: mockContext,
    } as unknown as ActionFunctionArgs)) as Response;
    expect(post.status).toBe(302);

    const row = (await env.DB.prepare(
      "SELECT password FROM urls WHERE id = 'wall-upgrade'",
    ).first()) as { password: string };
    expect(row.password.startsWith("pbkdf2-sha256$")).toBe(true);

    // The issued cookie matches the upgraded hash on the next (KV) visit
    const cookie = (post.headers.get("Set-Cookie") ?? "").split(";")[0];
    const visit = (await loader({
      request: new Request("http://localhost/wall-upgrade", {
        headers: new Headers({ host: "localhost", cookie }),
      }),
      params: { slug: "wall-upgrade" },
      context: mockContext,
    })) as Response;
    expect(visit.status).toBe(302);
  });

  it("Returns 429 once the password limiter rejects the client", async () => {
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, password)
       VALUES ('wall-limited', 'https://secure.com', 'user_1', datetime('now'), 'hash')`,
    ).run();
    const keys: string[] = [];
    const limitedEnv = {
      ...testEnv,
      PASSWORD_LIMITER: {
        limit: async ({ key }: { key: string }) => {
          keys.push(key);
          return { success: false };
        },
      },
    };

    const formData = new FormData();
    formData.set("password", "guess");
    const response = (await action({
      request: new Request("http://localhost/wall-limited", {
        method: "POST",
        headers: new Headers({ host: "localhost", "cf-connecting-ip": "203.0.113.7" }),
        body: formData,
      }),
      params: { slug: "wall-limited" },
      context: { cloudflare: { env: limitedEnv, ctx } } as unknown as AppLoadContext,
    } as unknown as ActionFunctionArgs)) as Response;

    expect(response.status).toBe(429);
    expect(keys).toEqual(["wall-limited:203.0.113.7"]);
  });

  it("Escapes in-app browsers after unlocking a protected link too", async () => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode("ig-pass"),
    );
    const hashHex = [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, password)
       VALUES ('wall-inapp', 'https://secure.com/page', 'user_1', datetime('now'), ?)`,
    )
      .bind(hashHex)
      .run();

    const formData = new FormData();
    formData.set("password", "ig-pass");
    const response = (await action({
      request: new Request("http://localhost/wall-inapp", {
        method: "POST",
        headers: new Headers({
          host: "localhost",
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0",
        }),
        body: formData,
      }),
      params: { slug: "wall-inapp" },
      context: { cloudflare: { env: testEnv, ctx } } as unknown as AppLoadContext,
    } as unknown as ActionFunctionArgs)) as Response;

    // iOS in-app browsers get the escape page (Instagram's own way out);
    // the access cookie still comes along
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(
      `instagram://extbrowser/?url=${encodeURIComponent("https://secure.com/page")}`,
    );
    expect(response.headers.get("Set-Cookie")).toContain("pw_wall-inapp=");
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
      cloudflare: { env: testEnv, ctx },
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
