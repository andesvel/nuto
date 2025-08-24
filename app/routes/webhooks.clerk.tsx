import type { ActionFunctionArgs } from "react-router";
import { Webhook } from "svix";
import { int64ToIso8601Auto } from "@/utils/int64-to-iso8601";

export async function action({ request, context }: ActionFunctionArgs) {
  const WEBHOOK_SECRET = context.cloudflare.env.CLERK_WEBHOOK_SECRET;

  // Verify if WEBHOOK_SECRET is set
  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET to your environment variables"
    );
  }

  // Get headers and payload
  const headers = request.headers;
  const payload = await request.text();

  // Get svix headers
  const svix_id = headers.get("svix-id");
  const svix_timestamp = headers.get("svix-timestamp");
  const svix_signature = headers.get("svix-signature");

  // Check if all svix headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
  }

  // Create webhook instance
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: {
    type: string;
    data: {
      id: string;
      email_addresses: Array<{ email_address: string }>;
      created_at: number;
    };
  };

  // Verify webhook
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as {
      type: string;
      data: {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        created_at: number;
      };
    };
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", { status: 400 });
  }

  // Get event data
  const { id, email_addresses, created_at } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      await context.cloudflare.env.DB.prepare(
        "INSERT INTO users (id, email, subscription_plan, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(
          id,
          email_addresses[0]?.email_address || "",
          "FREE", // default
          int64ToIso8601Auto(created_at) // Convert to ISO 8601
          // new Date().toISOString()
        )
        .run();

      console.log("User created in D1:", {
        id,
        email: email_addresses[0]?.email_address,
        created_at: int64ToIso8601Auto(created_at),
      });

      return new Response("User created successfully", { status: 200 });
    } catch (error) {
      console.error("Error creating user in D1:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    try {
      await context.cloudflare.env.DB.prepare(
        "UPDATE users SET email = ?, subscription_plan = ?, created_at = ? WHERE id = ?"
      )
        .bind(
          email_addresses[0]?.email_address || "",
          undefined,
          int64ToIso8601Auto(created_at),
          id
        )
        .run();

      console.log("User updated in D1:", {
        id,
        email: email_addresses[0]?.email_address,
        created_at: int64ToIso8601Auto(created_at),
      });

      return new Response("User updated successfully", { status: 200 });
    } catch (error) {
      console.error("Error updating user in D1:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    try {
      await context.cloudflare.env.DB.prepare("DELETE FROM users WHERE id = ?")
        .bind(id)
        .run();

      console.log("User deleted from D1:", {
        id,
      });

      return new Response("User deleted successfully", { status: 200 });
    } catch (error) {
      console.error("Error deleting user from D1:", error);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
