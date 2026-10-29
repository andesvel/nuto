import React from "react";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { readTextField } from "@utils/validate-link-input";
import {
  getRedirectWithExpiryById,
  updatePasswordHash,
} from "../repository/urls";
import { putRedirectEntry, isExpired } from "../repository/url-cache";
import { privateMeta } from "@/utils/seo";
import { localeFromMatches, messagesFor, resolveLocale } from "@/app/i18n";
import { finishRedirect } from "../lib/redirect.server";
import {
  createAccessCookie,
  hasValidAccessCookie,
  passwordFingerprint,
} from "@/utils/link-access";
import { hashLinkPassword, verifyLinkPassword } from "@/utils/password-hash";
import type { Route } from "./+types/link-gate";

import PasswordWall from "@/components/password-wall";

// UI side of a short link, reached from the /:slug resource route when the
// link needs a password or can't be redirected. It renders the password wall
// and turns missing/expired links into the app's styled error pages.

export function meta({ params, matches }: Route.MetaArgs) {
  const slug = params.slug ?? "";
  return privateMeta(messagesFor(localeFromMatches(matches)).meta.gateTitle(slug));
}

export async function loader({ params, context, request }: LoaderFunctionArgs) {
  const { slug } = params as { slug: string };

  const record = await getRedirectWithExpiryById(
    context.cloudflare.env.DB,
    slug,
  );
  if (!record) throw new Response("Not Found", { status: 404 });
  if (isExpired(record.expires_at)) {
    throw new Response("Expired", { status: 410 });
  }

  // Nothing to unlock (or already unlocked): back to the short link
  if (!record.password) return redirect(`/${slug}`);
  const encKey = context.cloudflare.env.PASSCODE_ENC_KEY;
  if (
    encKey &&
    (await hasValidAccessCookie(
      request.headers.get("cookie"),
      slug,
      await passwordFingerprint(record.password),
      encKey,
    ))
  ) {
    return redirect(`/${slug}`);
  }

  return { slug };
}

export async function action({ params, context, request }: ActionFunctionArgs) {
  const { slug } = params as { slug: string };
  if (!slug) return new Response("Bad Request", { status: 400 });

  const formData = await request.formData();
  const password = readTextField(formData, "password");

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
    return finishRedirect({ slug, longUrl: long_url, request, context });
  }

  // Throttle guesses per link and client. The client IP is only the limiter
  // key; it is never stored.
  const limiter = context.cloudflare.env.PASSWORD_LIMITER;
  if (limiter) {
    const client = request.headers.get("cf-connecting-ip") ?? "unknown";
    const { success } = await limiter.limit({ key: `${slug}:${client}` });
    if (!success) {
      return Response.json(
        {
          success: false,
          error: messagesFor(resolveLocale(request)).errors.tooManyAttempts,
          requiresPassword: true,
        },
        { status: 429 },
      );
    }
  }

  const { valid, needsRehash } = await verifyLinkPassword(password, storedHash);
  if (!valid) {
    return Response.json(
      {
        success: false,
        error: messagesFor(resolveLocale(request)).errors.invalidPassword,
        requiresPassword: true,
      },
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

  return finishRedirect({
    slug,
    longUrl: long_url,
    request,
    context,
    headers: { "Set-Cookie": cookie },
  });
}


export default function LinkGate() {
  return <PasswordWall />;
}
