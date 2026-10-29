/// <reference types="@cloudflare/vitest-plugin/types" />
import { env, createExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import type { AppLoadContext, LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { applySchema, TEST_ENC_KEY } from "../../../test/helpers";
import { encryptPassword } from "@/utils/crypto";
import { loader } from "../api.links.password";

vi.mock("@clerk/react-router/ssr.server", () => ({
  getAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
}));

const ctx = createExecutionContext();
const testEnv = { ...env, PASSCODE_ENC_KEY: TEST_ENC_KEY };
const call = (shortCode?: string) =>
  loader({
    request: new Request(
      `http://localhost/api/links/password${shortCode ? `?shortCode=${shortCode}` : ""}`,
    ),
    params: {},
    context: { cloudflare: { env: testEnv, ctx } } as unknown as AppLoadContext,
  } as unknown as LoaderFunctionArgs);

describe("password reveal endpoint", () => {
  beforeAll(async () => {
    await applySchema(env.DB);
  });

  beforeEach(async () => {
    vi.mocked(getAuth).mockResolvedValue({ userId: "user_1" } as never);
    await env.DB.prepare("DELETE FROM urls").run();
    await env.DB.prepare("DELETE FROM users").run();
    await env.DB.prepare(
      "INSERT INTO users (id, email, subscription_plan, created_at) VALUES ('user_1', 'a@nuto.com', 'free', datetime('now')), ('user_2', 'b@nuto.com', 'free', datetime('now'))",
    ).run();
    const enc = await encryptPassword("s3cret", TEST_ENC_KEY);
    await env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, password, password_enc) VALUES
       ('mine', 'https://a.com', 'user_1', datetime('now'), 'hash', ?1),
       ('open', 'https://a.com', 'user_1', datetime('now'), NULL, NULL),
       ('theirs', 'https://b.com', 'user_2', datetime('now'), 'hash', ?1)`,
    )
      .bind(enc)
      .run();
  });

  it("reveals the owner's password, uncached", async () => {
    const response = await call("mine");
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ password: "s3cret" });
  });

  it("never reveals someone else's password or one that doesn't exist", async () => {
    expect((await call("theirs")).status).toBe(404);
    expect((await call("open")).status).toBe(404);
    expect((await call()).status).toBe(400);
  });

  it("requires a session", async () => {
    vi.mocked(getAuth).mockResolvedValue({ userId: null } as never);
    expect((await call("mine")).status).toBe(401);
  });
});
