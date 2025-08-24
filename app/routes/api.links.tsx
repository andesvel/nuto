/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { encryptPassword } from "@/utils/crypto";
import { validateShortCode } from "@/utils/validate-short-code";
import { enforceUrlLimit } from "@/utils/enforce-link-limit";

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
    // return handleGetAllLinks(context, userId);
    return new Response("Method not allowed", { status: 405 });
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

async function hashPassword(password: string) {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function shortCodeTaken(context: any, shortCode: string) {
  const row = await context.cloudflare.env.DB.prepare(
    "SELECT 1 FROM urls WHERE id = ? LIMIT 1"
  )
    .bind(shortCode)
    .first();
  if (row) return { taken: true, source: "db" as const };

  const kv = await context.cloudflare.env.URL_STORE.get(shortCode);
  if (kv) return { taken: true, source: "kv" as const };

  return { taken: false, source: null } as const;
}

// Function to get a specific link
async function handleGetLink(context: any, userId: string, shortCode: string) {
  try {
    const link = await context.cloudflare.env.DB.prepare(
      `SELECT 
        urls.id as shortCode, 
        urls.long_url as longUrl, 
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
// async function handleGetAllLinks(context: any, userId: string) {
//   try {
//     const links = await context.cloudflare.env.DB.prepare(
//       `SELECT
//          urls.id AS shortCode,
//          urls.long_url AS longUrl,
//          urls.created_at AS createdAt,
//          urls.expires_at AS expiresAt,
//          urls.password_enc AS passwordEnc,
//          COUNT(clicks.id) AS clicks,
//          urls.last_clicked AS lastClicked
//        FROM urls
//        LEFT JOIN clicks ON urls.id = clicks.url_id
//        WHERE urls.user_id = ?
//        GROUP BY urls.id
//        ORDER BY COALESCE(urls.last_clicked, urls.created_at) DESC`
//     )
//       .bind(userId)
//       .all();

//     return new Response(JSON.stringify(links.results || []), {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching links:", error);
//     return new Response(JSON.stringify({ error: "Failed to fetch links" }), {
//       status: 500,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });
//   }
// }

// Function to create a new link
async function handleCreate(request: Request, context: any, userId: string) {
  const formData = await request.formData();
  const longUrl = formData.get("longUrl") as string;
  const shortCode = formData.get("shortCode") as string;
  const expiresAtRaw = (formData.get("expiresAt") as string) || "";
  const expiresAt = expiresAtRaw.trim() === "" ? null : expiresAtRaw; // ISO string
  const passwordRaw = (formData.get("password") as string) || "";
  const passwordHash = passwordRaw ? await hashPassword(passwordRaw) : null;
  const passwordEnc = passwordRaw
    ? await encryptPassword(
        passwordRaw,
        context.cloudflare.env.PASSCODE_ENC_KEY
      )
    : null;

  if (!longUrl || !shortCode) {
    return new Response("Missing required fields", {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { isValid, hasValidChars, isReserved } = validateShortCode(shortCode);
  if (!isValid) {
    const msg = !hasValidChars
      ? "Short code has invalid characters."
      : isReserved
      ? "This short code is reserved. Please choose another one."
      : "Invalid short code.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const exists = await shortCodeTaken(context, shortCode);
  if (exists.taken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Short code is already in use, please choose another one.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Enforce URL limit per user
    const max = Number(context.cloudflare.env.MAX_LINKS_PER_USER ?? 50);
    await enforceUrlLimit(context.cloudflare.env.DB, userId, max);

    await context.cloudflare.env.DB.prepare(
      `INSERT INTO urls (id, long_url, user_id, created_at, expires_at, password, password_enc)
     VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`
    )
      .bind(shortCode, longUrl, userId, expiresAt, passwordHash, passwordEnc)
      .run();

    await context.cloudflare.env.URL_STORE.put(
      shortCode,
      JSON.stringify({ longUrl, hasPassword: !!passwordHash }),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

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
  const originalShortCodeRaw = (
    (formData.get("originalShortCode") as string) || ""
  ).trim();
  const originalShortCode = originalShortCodeRaw || shortCode;
  const longUrl = formData.get("longUrl") as string;
  const expiresAtRaw = (formData.get("expiresAt") as string) || "";
  const expiresAt = expiresAtRaw.trim() === "" ? null : expiresAtRaw;
  const passwordRaw = (formData.get("password") as string) || "";
  const passwordHash = passwordRaw ? await hashPassword(passwordRaw) : null;
  const passwordEnc = passwordRaw
    ? await encryptPassword(
        passwordRaw,
        context.cloudflare.env.PASSCODE_ENC_KEY
      )
    : null;

  if (!originalShortCode || !shortCode || !longUrl) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (shortCode !== originalShortCode) {
    const { isValid, hasValidChars, isReserved } = validateShortCode(shortCode);
    if (!isValid) {
      const msg = !hasValidChars
        ? "Short code has invalid characters."
        : isReserved
        ? "This short code is reserved. Please choose another one."
        : "Invalid short code.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    // Verify that the link belongs to the user
    const link = await context.cloudflare.env.DB.prepare(
      "SELECT * FROM urls WHERE id = ? AND user_id = ?"
    )
      .bind(originalShortCode, userId)
      .first();

    if (!link) {
      return new Response("Link not found or you don't have permission", {
        status: 404,
      });
    }

    const now = new Date().toISOString();

    if (shortCode !== originalShortCode) {
      // Avoid duplicate short codes
      const exists = await shortCodeTaken(context, shortCode);
      if (exists.taken) {
        return new Response(
          JSON.stringify({
            error: "Short code is already in use, please choose another one.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update database
      await context.cloudflare.env.DB.prepare(
        "UPDATE urls SET id = ?, long_url = ?, password = ?, password_enc = ?, updated_at = ?, expires_at = ? WHERE id = ? AND user_id = ?"
      )
        .bind(
          shortCode,
          longUrl,
          passwordHash,
          passwordEnc,
          now,
          expiresAt,
          originalShortCode,
          userId
        )
        .run();

      await context.cloudflare.env.URL_STORE.delete(originalShortCode);
      await context.cloudflare.env.URL_STORE.put(
        shortCode,
        JSON.stringify({ longUrl, hasPassword: !!passwordHash }),
        { expirationTtl: 60 * 60 * 24 * 30 }
      );
    } else {
      // If no shortCode editing: update fields and KV
      await context.cloudflare.env.DB.prepare(
        "UPDATE urls SET long_url = ?, password = ?, password_enc = ?, updated_at = ?, expires_at = ? WHERE id = ?"
      )
        .bind(longUrl, passwordHash, passwordEnc, now, expiresAt, shortCode)
        .run();

      await context.cloudflare.env.URL_STORE.put(
        shortCode,
        JSON.stringify({ longUrl, hasPassword: !!passwordHash }),
        { expirationTtl: 60 * 60 * 24 * 30 }
      );
    }

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
