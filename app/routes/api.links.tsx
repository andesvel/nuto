/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";

// Add loader to handle GET requests
export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const { userId } = await getAuth({ request, context, params });

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const shortCode = url.searchParams.get("id");

  if (shortCode) {
    // Get a specific link
    return handleGetLink(context, userId, shortCode);
  } else {
    // Get all links
    return handleGetAllLinks(context, userId);
  }
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  const { userId } = await getAuth({ request, context, params });

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Determine the type of operation being performed based on the HTTP method
  if (request.method === "POST") {
    return handleCreate(request, context, userId);
  } else if (request.method === "PUT") {
    return handleUpdate(request, context, userId);
  } else if (request.method === "DELETE") {
    return handleDelete(request, context, userId);
  }

  return new Response("Method not allowed", { status: 405 });
}

// Function to get a specific link
async function handleGetLink(context: any, userId: string, shortCode: string) {
  try {
    const link = await context.cloudflare.env.DB.prepare(
      `SELECT 
        urls.id as shortUrl, 
        urls.long_url as originalUrl, 
        urls.created_at as createdAt,
        urls.expires_at as expiresAt,
        urls.password,
        COUNT(clicks.id) as clicks
      FROM urls
      LEFT JOIN clicks ON urls.id = clicks.url_id
      WHERE urls.id = ? AND urls.user_id = ?
      GROUP BY urls.id`
    )
      .bind(shortCode, userId)
      .first();

    if (!link) {
      return new Response("Link not found", { status: 404 });
    }

    return new Response(JSON.stringify(link), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching link:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch link" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

// Function to get all links for a user
async function handleGetAllLinks(context: any, userId: string) {
  try {
    const links = await context.cloudflare.env.DB.prepare(
      `SELECT 
        urls.id as shortUrl, 
        urls.long_url as originalUrl, 
        urls.created_at as createdAt,
        urls.expires_at as expiresAt,
        urls.password,
        COUNT(clicks.id) as clicks
      FROM urls
      LEFT JOIN clicks ON urls.id = clicks.url_id
      WHERE urls.user_id = ?
      GROUP BY urls.id
      ORDER BY urls.created_at DESC`
    )
      .bind(userId)
      .all();

    return new Response(JSON.stringify(links.results || []), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching links:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch links" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

// Function to create a new link
async function handleCreate(request: Request, context: any, userId: string) {
  const formData = await request.formData();
  const longUrl = formData.get("longUrl") as string;
  const shortCode = formData.get("shortCode") as string;
  const password = formData.get("password") as string;
  const expiresAtRaw = (formData.get("expiresAt") as string) || "";
  const expiresAt = expiresAtRaw.trim() === "" ? null : expiresAtRaw; // ISO string

  if (!longUrl || !shortCode) {
    return new Response("Missing required fields", { status: 400 });
  }

  try {
    // Store the link in the D1 database
    await context.cloudflare.env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at, password)
     VALUES (?, ?, ?, datetime('now'), ?, ?)`
    )
      .bind(shortCode, longUrl, userId, expiresAt, password)
      .run();

    // Also store in KV for fast resolution
    await context.cloudflare.env.URL_STORE.put(shortCode, longUrl, {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });

    return new Response(JSON.stringify({ success: true, shortCode }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating link:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to create link" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Function to update an existing link
async function handleUpdate(request: Request, context: any, userId: string) {
  const formData = await request.formData();
  const shortCode = formData.get("shortCode") as string;
  const longUrl = formData.get("longUrl") as string;
  const password = formData.get("password") as string;

  if (!shortCode || !longUrl) {
    return new Response("Missing required fields", { status: 400 });
  }

  try {
    // Verify that the link belongs to the user
    const link = await context.cloudflare.env.DB.prepare(
      "SELECT * FROM urls WHERE id = ? AND user_id = ?"
    )
      .bind(shortCode, userId)
      .first();

    if (!link) {
      return new Response("Link not found or you don't have permission", {
        status: 404,
      });
    }

    // Update database
    await context.cloudflare.env.DB.prepare(
      "UPDATE urls SET long_url = ?, password = ?, updated_at = ? WHERE id = ?"
    )
      .bind(longUrl, password || null, new Date().toISOString(), shortCode)
      .run();

    // Update KV
    await context.cloudflare.env.URL_STORE.put(shortCode, longUrl, {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating link:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to update link" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Function to delete a link
async function handleDelete(request: Request, context: any, userId: string) {
  const url = new URL(request.url);
  const shortCode = url.searchParams.get("shortCode");

  if (!shortCode) {
    return new Response("Missing shortCode parameter", { status: 400 });
  }

  try {
    // Verify that the link belongs to the user
    const link = await context.cloudflare.env.DB.prepare(
      "SELECT * FROM urls WHERE id = ? AND user_id = ?"
    )
      .bind(shortCode, userId)
      .first();

    if (!link) {
      return new Response("Link not found or you don't have permission", {
        status: 404,
      });
    }

    // Delete from database
    await context.cloudflare.env.DB.prepare("DELETE FROM urls WHERE id = ?")
      .bind(shortCode)
      .run();

    // Delete from KV
    await context.cloudflare.env.URL_STORE.delete(shortCode);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error deleting link:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to delete link" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
