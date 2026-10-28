import { redirect, type AppLoadContext } from "react-router";
import { getRedirectWithExpiryById } from "../repository/urls";
import {
  getRedirectEntry,
  putRedirectEntry,
  deleteRedirectEntry,
  isExpired,
} from "../repository/url-cache";
import { finishRedirect } from "../lib/redirect.server";
import {
  hasValidAccessCookie,
  passwordFingerprint,
} from "@/utils/link-access";

// Resource route (loader only): resolving a short link never runs the root
// loader (Clerk) or renders React. The common case is a KV hit and a 302.
// Anything that needs a page (password wall, missing or expired link) is
// handed to /p/:slug.

function linkGatePath(slug: string): string {
  return `/p/${encodeURIComponent(slug)}`;
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
  if (!slug) return new Response("Bad Request", { status: 400 });

  let longUrl: string;
  let hasPassword = false;
  let fingerprint: string | null = null;

  // Try KV first
  const entry = await getRedirectEntry(context.cloudflare.env.URL_STORE, slug);

  if (entry) {
    // KV can outlive the link (e.g. entries written before expiry was cached).
    // The D1 row stays for the nightly cleanup so /p/:slug can answer 410.
    if (isExpired(entry.expiresAt)) {
      context.cloudflare.ctx.waitUntil(
        deleteRedirectEntry(context.cloudflare.env.URL_STORE, slug),
      );
      return redirect(linkGatePath(slug));
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

    if (!record) return redirect(linkGatePath(slug));

    const { long_url, password, expires_at } = record;

    if (isExpired(expires_at)) return redirect(linkGatePath(slug));

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

    if (!authed) return redirect(linkGatePath(slug));
  }

  return finishRedirect({ slug, longUrl, request, context });
}
