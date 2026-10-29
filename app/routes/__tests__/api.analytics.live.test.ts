/// <reference types="@cloudflare/vitest-plugin/types" />
import { env, createExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import type { AppLoadContext, LoaderFunctionArgs } from "react-router";
import { applySchema } from "../../../test/helpers";
import { getAuth } from "@clerk/react-router/ssr.server";
import { loader } from "../api.analytics.live";

vi.mock("@clerk/react-router/ssr.server", () => ({
  getAuth: vi.fn().mockResolvedValue({ userId: "user_1" }),
}));

const ctx = createExecutionContext();
const call = (query = "") =>
  loader({
    request: new Request(`http://localhost/api/analytics/live${query}`),
    params: {},
    context: { cloudflare: { env, ctx } } as unknown as AppLoadContext,
  } as unknown as LoaderFunctionArgs);

describe("live analytics endpoint", () => {
  beforeAll(async () => {
    await applySchema(env.DB);
  });

  beforeEach(async () => {
    vi.mocked(getAuth).mockResolvedValue({ userId: "user_1" } as never);
    await env.DB.prepare("DELETE FROM clicks").run();
    await env.DB.prepare("DELETE FROM urls").run();
    await env.DB.prepare("DELETE FROM users").run();
    await env.DB.prepare(
      "INSERT INTO users (id, email, subscription_plan, created_at) VALUES ('user_1', 'a@nuto.com', 'free', datetime('now')), ('user_2', 'b@nuto.com', 'free', datetime('now'))",
    ).run();
    await env.DB.prepare(
      "INSERT INTO urls (id, long_url, user_id, created_at) VALUES ('mine', 'https://a.com', 'user_1', datetime('now')), ('theirs', 'https://b.com', 'user_2', datetime('now'))",
    ).run();
    await env.DB.prepare(
      "INSERT INTO clicks (url_id, clicked_at, app, device) VALUES ('mine', datetime('now'), 'instagram', 'ios'), ('theirs', datetime('now'), NULL, 'desktop')",
    ).run();
  });

  it("requires a session", async () => {
    vi.mocked(getAuth).mockResolvedValue({ userId: null } as never);
    expect((await call()).status).toBe(401);
  });

  it("returns only the user's recent clicks, uncached", async () => {
    const response = await call();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const data = (await response.json()) as { recent: { shortCode: string }[] };
    expect(data.recent.map((c) => c.shortCode)).toEqual(["mine"]);
  });

  it("refuses to filter by someone else's link", async () => {
    expect((await call("?link=theirs")).status).toBe(404);
  });
});
