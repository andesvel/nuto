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
  getRedirectWithExpiryById,
  deleteLinkById,
  updatePasswordHash,
} from "../repository/urls";
import { insertClick, updateLastClicked } from "../repository/clicks";
import {
  getRedirectEntry,
  putRedirectEntry,
  deleteRedirectEntry,
  isExpired,
} from "../repository/url-cache";
import type { Route } from "./+types/redirect";

import {
  createAccessCookie,
  hasValidAccessCookie,
  passwordFingerprint,
} from "@/utils/link-access";
import { hashLinkPassword, verifyLinkPassword } from "@/utils/password-hash";

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

  const record = await getRedirectWithExpiryById(
    context.cloudflare.env.DB,
    slug,
  );

  if (!record) return new Response("Not Found", { status: 404 });

  const { long_url, password: hashInDb, expires_at } = record;
  let storedHash = hashInDb;

  if (isExpired(expires_at)) {
    return new Response("Expired", { status: 410 });
  }

  if (!storedHash) {
    const dest = long_url.startsWith("http") ? long_url : `http://${long_url}`;
    return redirect(dest, { status: 302 });
  }

  const { valid, needsRehash } = await verifyLinkPassword(password, storedHash);
  if (!valid) {
    return Response.json(
      { success: false, error: "Invalid password", requiresPassword: true },
      { status: 401 },
    );
  }

  // Transparent migration off legacy SHA-256: re-hash with PBKDF2 now that we
  // know the plaintext. D1 and KV are updated before the cookie is issued so
  // its fingerprint matches what the loader will read.
  if (needsRehash) {
    try {
      const upgraded = await hashLinkPassword(password);
      await updatePasswordHash(context.cloudflare.env.DB, slug, upgraded);
      await putRedirectEntry(context.cloudflare.env.URL_STORE, slug, {
        longUrl: long_url,
        hasPassword: true,
        passwordFingerprint: await passwordFingerprint(upgraded),
        expiresAt: expires_at,
      });
      storedHash = upgraded;
    } catch (err) {
      // Keep the legacy hash; the next unlock retries the upgrade
      console.error(`[Action /${slug}] Password re-hash failed`, err);
    }
  }

  const userAgentRaw = request.headers.get("user-agent") || "";
  const userAgent = userAgentRaw.slice(0, 500);
  const country =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).cf?.country || request.headers.get("cf-ipcountry") || null;

  const encKey = context.cloudflare.env.PASSCODE_ENC_KEY;
  if (!encKey) {
    console.error(`[Action /${slug}] PASSCODE_ENC_KEY is not configured`);
    return new Response("Server misconfigured", { status: 500 });
  }
  const cookie = await createAccessCookie(
    slug,
    await passwordFingerprint(storedHash),
    encKey,
    { secure: new URL(request.url).protocol === "https:" },
  );

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
  let fingerprint: string | null = null;

  // Try KV first
  const entry = await getRedirectEntry(context.cloudflare.env.URL_STORE, slug);

  if (entry) {
    // KV can outlive the link (e.g. entries written before expiry was cached)
    if (isExpired(entry.expiresAt)) {
      context.cloudflare.ctx.waitUntil(
        Promise.all([
          deleteRedirectEntry(context.cloudflare.env.URL_STORE, slug),
          deleteLinkById(context.cloudflare.env.DB, slug),
        ]),
      );
      throw new Response("Expired", { status: 410 });
    }

    longUrl = entry.longUrl;
    hasPassword = entry.hasPassword;
    fingerprint = entry.passwordFingerprint ?? null;
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
    if (isExpired(expires_at)) {
      context.cloudflare.ctx.waitUntil(
        deleteLinkById(context.cloudflare.env.DB, slug),
      );
      throw new Response("Expired", { status: 410 });
    }

    longUrl = long_url;
    hasPassword = !!password;
    fingerprint = password ? await passwordFingerprint(password) : null;

    // Async KV repopulation (the fingerprint lets secured links skip D1)
    context.cloudflare.ctx.waitUntil(
      putRedirectEntry(context.cloudflare.env.URL_STORE, slug, {
        longUrl,
        hasPassword,
        passwordFingerprint: fingerprint,
        expiresAt: expires_at,
      }),
    );
  }

  // URL Normalization
  if (!longUrl.startsWith("http://") && !longUrl.startsWith("https://")) {
    longUrl = `http://${longUrl}`;
  }

  // Password wall
  // Fail closed: a protected link always needs a valid signed cookie
  if (hasPassword) {
    const encKey = context.cloudflare.env.PASSCODE_ENC_KEY;
    const authed =
      !!fingerprint &&
      !!encKey &&
      (await hasValidAccessCookie(
        request.headers.get("cookie"),
        slug,
        fingerprint,
        encKey,
      ));

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
