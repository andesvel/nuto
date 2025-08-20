import React from "react";
import {
  redirect,
  type AppLoadContext,
  type ActionFunctionArgs,
} from "react-router";

import PasswordWall from "@/components/password-wall";

export async function action({ params, context, request }: ActionFunctionArgs) {
  const { slug } = params as { slug: string };
  if (!slug) return new Response("Bad Request", { status: 400 });

  const formData = await request.formData();
  const password = (formData.get("password") as string) || "";

  const record = await context.cloudflare.env.DB.prepare(
    "SELECT long_url, password FROM urls WHERE id = ?"
  )
    .bind(slug)
    .first();

  if (!record) return new Response("Not Found", { status: 404 });

  const { long_url, password: storedHash } = record as {
    long_url: string;
    password: string | null;
  };

  if (!storedHash) {
    const dest = long_url.startsWith("http") ? long_url : `http://${long_url}`;
    return redirect(dest, { status: 302 });
  }

  // Verify
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const enteredHash = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (enteredHash !== storedHash) {
    return Response.json(
      { success: false, error: "Invalid password", requiresPassword: true },
      { status: 401 }
    );
  }

  const cookie = `pw_${slug}=1; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax`;

  const dest = long_url.startsWith("http") ? long_url : `http://${long_url}`;
  return redirect(dest, {
    status: 302,
    headers: { "Set-Cookie": cookie },
  });
}

export async function loader({
  params,
  context,
  request,
}: {
  params: { slug: string };
  context: AppLoadContext;
  request: Request;
}) {
  const { slug } = params;
  if (!slug) {
    throw new Response("Bad Request: Short code parameter is missing.", {
      status: 400,
    });
  }

  const kvRaw = await context.cloudflare.env.URL_STORE.get(slug);
  if (!kvRaw) {
    console.error(`[Loader /${slug}] Not found in KV`);
    throw new Response("Not Found", { status: 404 });
  }

  let longUrl: string;
  let hasPassword = false;
  try {
    const parsed = JSON.parse(kvRaw);
    if (parsed && typeof parsed === "object" && "longUrl" in parsed) {
      longUrl = parsed.longUrl;
      hasPassword = !!parsed.hasPassword;
    } else {
      longUrl = kvRaw;
    }
  } catch {
    longUrl = kvRaw;
  }

  if (!longUrl.startsWith("http://") && !longUrl.startsWith("https://")) {
    longUrl = `http://${longUrl}`;
  }

  // Password wall
  if (hasPassword) {
    const cookieHeader = request.headers.get("cookie") || "";
    const authed = cookieHeader.includes(`pw_${slug}=1`);
    if (!authed) {
      return Response.json({ requiresPassword: true, slug });
    }
  }

  // Click log
  const userAgentRaw = request.headers.get("user-agent") || "";
  const userAgent = userAgentRaw.slice(0, 500);
  const country =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).cf?.country || request.headers.get("cf-ipcountry") || null;

  // Validate URL
  try {
    new URL(longUrl);
  } catch (e) {
    console.error(`[Loader /${slug}] Invalid URL stored: ${longUrl}`, e);
    throw new Response("Invalid stored URL", { status: 500 });
  }

  try {
    context.cloudflare.ctx.waitUntil(
      (async () => {
        try {
          await context.cloudflare.env.DB.prepare(
            "INSERT INTO clicks (url_id, clicked_at, country, user_agent) VALUES (?, datetime('now'), ?, ?)"
          )
            .bind(slug, country, userAgent)
            .run();
          await context.cloudflare.env.DB.prepare(
            "UPDATE urls SET last_clicked = datetime('now') WHERE id = ?"
          )
            .bind(slug)
            .run();
        } catch (err) {
          console.error(`[Loader /${slug}] Async click log failed`, err);
        }
      })()
    );
  } catch (e) {
    console.error(`[Loader /${slug}] Scheduling logging failed`, e);
  }

  return redirect(longUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export default function Redirect() {
  return <PasswordWall />;
}
