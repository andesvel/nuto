import { redirect, type AppLoadContext } from "react-router";
import { attributeClick } from "@/utils/click-attribution";
import { planOpen } from "@/utils/open-plan";
import { LOCALE_TAGS, messagesFor, resolveLocale } from "@/app/i18n";
import { renderOpenPage } from "./open-page.server";
import { isSelfReferential } from "@utils/is-self-referential";
import { toAbsoluteUrl } from "@utils/url";
import { createsCycle } from "@utils/cycle-detection";
import { getLongUrlById } from "../repository/urls";
import { recordClick } from "../repository/clicks";

/**
 * Last step for both the short-link loader and the password action: validate the
 * target, log the click without blocking, and send the visitor on. Desktop
 * and plain cases get a 302; on phones the open plan may deep link into
 * the destination's app or leave an in-app browser through the open page
 * (utils/open-plan.ts). Problems are thrown as Responses for the error
 * boundary.
 */
export async function finishRedirect({
  slug,
  longUrl,
  request,
  context,
  headers,
}: {
  slug: string;
  longUrl: string;
  request: Request;
  context: AppLoadContext;
  headers?: HeadersInit;
}): Promise<Response> {
  const target = toAbsoluteUrl(longUrl);
  const host = request.headers.get("host");

  try {
    new URL(target);
  } catch (e) {
    console.error(`[/${slug}] Invalid URL stored`, e);
    throw new Response("Invalid stored URL", { status: 500 });
  }

  // Prevent self-referential redirects and cross-slug cycles on this host
  if (
    isSelfReferential(target, slug, host) ||
    (await createsCycle(slug, target, host, (code) =>
      getLongUrlById(context.cloudflare.env.DB, code).catch(() => null),
    ))
  ) {
    throw new Response("Not Found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  scheduleClickLog(context, request, slug, userAgent);

  const plan = planOpen(target, userAgent);
  if (plan.kind === "page") {
    const locale = resolveLocale(request);
    return renderOpenPage(plan, messagesFor(locale), LOCALE_TAGS[locale], new Headers(headers));
  }

  const responseHeaders = new Headers(headers);
  responseHeaders.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  responseHeaders.set("Pragma", "no-cache");
  responseHeaders.set("Expires", "0");
  return redirect(plan.location, { status: 302, headers: responseHeaders });
}

function scheduleClickLog(
  context: AppLoadContext,
  request: Request,
  slug: string,
  userAgent: string,
) {
  const country =
    (request.cf?.country as string | undefined) ??
    request.headers.get("cf-ipcountry") ??
    null;

  context.cloudflare.ctx.waitUntil(
    (async () => {
      try {
        await recordClick(context.cloudflare.env.DB, {
          urlId: slug,
          country,
          userAgent: userAgent.slice(0, 500),
          ...attributeClick(new URL(request.url), userAgent),
        });
      } catch (err) {
        console.error(`[/${slug}] Async click log failed`, err);
      }
    })(),
  );
}
