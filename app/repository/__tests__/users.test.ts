/// <reference types="@cloudflare/vitest-pool-workers" />
import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import schema from "../../../schema.sql?raw";
import { insertUser, updateUser, deleteUserById } from "../users";

describe("users repository", () => {
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

  it("insertUser stores the Clerk user with the default plan", async () => {
    await insertUser(env.DB, {
      id: "user_new",
      email: "new@nuto.com",
      subscriptionPlan: "FREE",
      createdAt: "2024-05-01T00:00:00.000Z",
    });

    const row = await env.DB
      .prepare(
        "SELECT id, email, subscription_plan, created_at FROM users WHERE id = 'user_new'",
      )
      .first<{
        id: string;
        email: string;
        subscription_plan: string;
        created_at: string;
      }>();

    expect(row).toEqual({
      id: "user_new",
      email: "new@nuto.com",
      subscription_plan: "FREE",
      created_at: "2024-05-01T00:00:00.000Z",
    });
  });

  it("updateUser updates the stored profile fields", async () => {
    await insertUser(env.DB, {
      id: "user_upd",
      email: "before@nuto.com",
      subscriptionPlan: "FREE",
      createdAt: "2024-05-01T00:00:00.000Z",
    });

    await updateUser(env.DB, {
      id: "user_upd",
      email: "after@nuto.com",
      subscriptionPlan: "PRO",
      createdAt: "2024-06-01T00:00:00.000Z",
    });

    const row = await env.DB
      .prepare(
        "SELECT email, subscription_plan, created_at FROM users WHERE id = 'user_upd'",
      )
      .first<{
        email: string;
        subscription_plan: string;
        created_at: string;
      }>();

    expect(row).toEqual({
      email: "after@nuto.com",
      subscription_plan: "PRO",
      created_at: "2024-06-01T00:00:00.000Z",
    });
  });

  it("deleteUserById removes the row", async () => {
    await insertUser(env.DB, {
      id: "user_del",
      email: "del@nuto.com",
      subscriptionPlan: "FREE",
      createdAt: "2024-05-01T00:00:00.000Z",
    });

    await deleteUserById(env.DB, "user_del");

    const row = await env.DB
      .prepare("SELECT id FROM users WHERE id = 'user_del'")
      .first();
    expect(row).toBeNull();
  });
});
