import React from "react";
import {
  redirect,
  type AppLoadContext,
  type ActionFunctionArgs,
} from "react-router";
import InAppSpy from "inapp-spy";
import { inAppEscape } from "@utils/in-app-escape";
import { isSelfReferential } from "@utils/is-self-referencial";
import { createsCycle } from "@utils/cycle-detection";
import {
  getLongUrlById,
  getRedirectTargetById,
  getRedirectWithExpiryById,
  deleteLinkById,
} from "../repository/urls";
import { insertClick, updateLastClicked } from "../repository/clicks";
import {
  getRedirectEntry,
  putRedirectEntry,
} from "../repository/url-cache";
import type { Route } from "./+types/redirect";

import PasswordWall from "@/components/password-wall";

export function meta({ params }: Route.MetaArgs) {
  const slug = params.slug ?? "";
  return [
    { title: `Opening ${slug} · Nuto` },
    { name: "robots", content: "noindex" },
  ];
}

export async function action({ params, context, request }: ActionFunctionArgs) {
  const { slug } = params as { slug: string };
  if (!slug) return new Response("Bad Request", { status: 400 });

  const formData = await request.formData();
  const password = (formData.get("password") as string) || "";

  const record = await getRedirectTargetById(context.cloudflare.env.DB, slug);

  if (!record) return new Response("Not Found", { status: 404 });

  const { long_url, password: storedHash } = record;

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
      { status: 401 },
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
    slug,
    dest,
    request.headers.get("host"),
    (code) =>
      getLongUrlById(context.cloudflare.env.DB, code).catch(() => null),
  );
  if (hasCycle) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    context.cloudflare.ctx.waitUntil(
      (async () => {
        try {
          await insertClick(context.cloudflare.env.DB, {
            urlId: slug,
            country,
            userAgent,
          });
          await updateLastClicked(context.cloudflare.env.DB, slug);
        } catch (err) {
          console.error(`[Action /${slug}] Async click log failed`, err);
        }
      })(),
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

  let longUrl: string;
  let hasPassword = false;
  let storedHash: string | null = null;

  // Try KV first
  const entry = await getRedirectEntry(context.cloudflare.env.URL_STORE, slug);

  if (entry) {
    longUrl = entry.longUrl;
    hasPassword = entry.hasPassword;
    storedHash = entry.storedHash ?? null;
  } else {
    // Fallback to DB solely if KV misses
    const record = await getRedirectWithExpiryById(
      context.cloudflare.env.DB,
      slug,
    );

    if (!record) {
      console.error(`[Loader /${slug}] Not found in DB`);
      throw new Response("Not Found", { status: 404 });
    }

    const { long_url, password, expires_at } = record;

    // Check expiration
    if (expires_at && new Date(expires_at) < new Date()) {
      context.cloudflare.ctx.waitUntil(
        deleteLinkById(context.cloudflare.env.DB, slug),
      );
      throw new Response("Expired", { status: 410 });
    }

    longUrl = long_url;
    hasPassword = !!password;
    storedHash = password;

    // Async KV repopulation (Includes storedHash to prevent DB hits on secured links)
    context.cloudflare.ctx.waitUntil(
      putRedirectEntry(
        context.cloudflare.env.URL_STORE,
        slug,
        {
          longUrl,
          hasPassword,
          storedHash,
        },
        { expirationTtl: 2592000 }, // 30 days
      ),
    );
  }

  // URL Normalization
  if (!longUrl.startsWith("http://") && !longUrl.startsWith("https://")) {
    longUrl = `http://${longUrl}`;
  }

  // Password wall
  if (hasPassword && storedHash) {
    const cookieHeader = request.headers.get("cookie") || "";
    const verifier = storedHash.slice(0, 16);
    const authed = cookieHeader.includes(`pw_${slug}=${verifier}`);

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
  if (
    await createsCycle(slug, longUrl, request.headers.get("host"), (code) =>
      getLongUrlById(context.cloudflare.env.DB, code).catch(() => null),
    )
  ) {
    throw new Response("Not Found", { status: 404 });
  }

  try {
    context.cloudflare.ctx.waitUntil(
      (async () => {
        try {
          await insertClick(context.cloudflare.env.DB, {
            urlId: slug,
            country,
            userAgent,
          });
          await updateLastClicked(context.cloudflare.env.DB, slug);
        } catch (err) {
          console.error(`[Loader /${slug}] Async click log failed`, err);
        }
      })(),
    );
  } catch (e) {
    console.error(`[Loader /${slug}] Scheduling logging failed`, e);
  }

  // In-app detection
  const { isInApp } = InAppSpy({ ua: userAgentRaw });
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
