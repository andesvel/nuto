import React from "react";
import {
  redirect,
  type AppLoadContext,
  type ActionFunctionArgs,
} from "react-router";
import InAppSpy from "inapp-spy";
import { inAppEscape } from "@utils/in-app-escape";
import { isSelfReferential } from "@utils/is-self-referencial";
import type { Route } from "./+types/redirect";

import PasswordWall from "@/components/password-wall";

export function meta({ params }: Route.MetaArgs) {
  const slug = params.slug ?? "";
  return [
    { title: `Opening ${slug} · Nuto` },
    { name: "robots", content: "noindex" },
  ];
}

// Helpers to detect cycles between short links on same host
async function getLongUrlBySlug(
  context: AppLoadContext,
  code: string
): Promise<string | null> {
  try {
    const row = await context.cloudflare.env.DB.prepare(
      "SELECT long_url FROM urls WHERE id = ?"
    )
      .bind(code)
      .first();
    if (!row) return null;
    const { long_url } = row as { long_url: string };
    return long_url?.startsWith("http") ? long_url : `http://${long_url}`;
  } catch {
    return null;
  }
}

function extractSlugOnSameHost(targetUrl: string, hostHeader: string | null) {
  try {
    const url = new URL(
      targetUrl.startsWith("http") ? targetUrl : `http://${targetUrl}`
    );
    const reqHost = (hostHeader || "").toLowerCase().split(":")[0];
    if (!reqHost || url.hostname.toLowerCase() !== reqHost) return null;
    const path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    const slug = path.split("/")[0] || "";
    return slug || null;
  } catch {
    return null;
  }
}

async function createsCycle(
  context: AppLoadContext,
  startSlug: string,
  firstTargetUrl: string,
  hostHeader: string | null,
  maxDepth = 5
): Promise<boolean> {
  const visited = new Set<string>([startSlug]);
  let depth = 0;
  let nextSlug = extractSlugOnSameHost(firstTargetUrl, hostHeader);

  while (nextSlug && depth < maxDepth) {
    if (visited.has(nextSlug)) return true; // cycle detected
    visited.add(nextSlug);

    const nextLong = await getLongUrlBySlug(context, nextSlug);
    if (!nextLong) return false;

    nextSlug = extractSlugOnSameHost(nextLong, hostHeader);
    depth++;
  }
  return false;
}

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

  const userAgentRaw = request.headers.get("user-agent") || "";
  const userAgent = userAgentRaw.slice(0, 500);
  const country =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).cf?.country || request.headers.get("cf-ipcountry") || null;

  const verifier = storedHash.slice(0, 16);
  const secureAttr =
    new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const cookie = `pw_${slug}=${verifier}; Path=/; HttpOnly; Max-Age=3600; SameSite=Lax${secureAttr}`;

  const dest = long_url.startsWith("http") ? long_url : `http://${long_url}`;

  // Validate URL
  try {
    new URL(dest);
  } catch {
    return new Response("Invalid stored URL", { status: 500 });
  }
  if (isSelfReferential(dest, slug, request.headers.get("host"))) {
    return new Response("Not Found", { status: 404 });
  }

  // Prevent cross-slug cycles on same host
  const hasCycle = await createsCycle(
    context as unknown as AppLoadContext,
    slug,
    dest,
    request.headers.get("host")
  );
  if (hasCycle) {
    return new Response("Not Found", { status: 404 });
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
          console.error(`[Action /${slug}] Async click log failed`, err);
        }
      })()
    );
  } catch (e) {
    console.error(`[Action /${slug}] Scheduling logging failed`, e);
  }

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

  const record = await context.cloudflare.env.DB.prepare(
    "SELECT long_url, password, expires_at FROM urls WHERE id = ?"
  )
    .bind(slug)
    .first();

  if (!record) {
    console.error(`[Loader /${slug}] Not found in DB`);
    throw new Response("Not Found", { status: 404 });
  }

  const {
    long_url,
    password: storedHash,
    expires_at,
  } = record as {
    long_url: string;
    password: string | null;
    expires_at: string | null;
  };

  // Check if the link has expired
  if (expires_at && new Date(expires_at) < new Date()) {
    // Schedule deletion from DB and KV in the background
    context.cloudflare.ctx.waitUntil(
      (async () => {
        try {
          // Delete from D1 database
          await context.cloudflare.env.DB.prepare(
            "DELETE FROM urls WHERE id = ?"
          )
            .bind(slug)
            .run();
          // Delete from KV store
          await context.cloudflare.env.URL_STORE.delete(slug);
          console.log(`[Loader /${slug}] Expired link deleted.`);
        } catch (err) {
          console.error(`[Loader /${slug}] Failed to delete expired link`, err);
        }
      })()
    );

    // Throw a response to trigger the root ErrorBoundary
    throw new Response("This link has expired and has been removed.", {
      status: 410, // Gone
    });
  }

  let longUrl = long_url;
  let hasPassword = !!storedHash;

  const kvRaw = await context.cloudflare.env.URL_STORE.get(slug);
  if (!kvRaw) {
    console.error(`[Loader /${slug}] Not found in KV`);
    throw new Response("Not Found", { status: 404 });
  }

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
    const verifier = (storedHash ?? "").slice(0, 16);
    const authed = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .some((c) => c === `pw_${slug}=${verifier}`);

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

  // Prevent self-referential redirects
  if (isSelfReferential(longUrl, slug, request.headers.get("host"))) {
    throw new Response("Not Found", { status: 404 });
  }

  // Prevent cross-slug cycles on same host
  if (await createsCycle(context, slug, longUrl, request.headers.get("host"))) {
    throw new Response("Not Found", { status: 404 });
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

  // In-app detection
  const { isInApp, appKey } = InAppSpy({ ua: userAgentRaw });
  if (isInApp && appKey) {
    console.log(`[Loader /${slug}] In-app detected: ${appKey}`);
  }

  const dest =
    (isInApp ? inAppEscape(longUrl, userAgentRaw) : longUrl) ?? longUrl;

  return redirect(dest, {
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
