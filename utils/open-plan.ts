import { escapeMethod } from "./browser-escape";
import { androidIntent, findDeepLinkApp } from "./deep-links";
import { detectApp } from "./in-app-detect";

export interface EscapePage {
  /** Tried with a meta refresh while the page loads */
  auto: string | null;
  /** Offered as the main button */
  tap: { url: string; mode: "link" | "window" } | null;
  destination: string;
  /** The destination's app, when it has an iOS scheme worth offering */
  app: { name: string; url: string } | null;
  inAppName: string | null;
}

export type OpenDecision =
  | { kind: "redirect"; location: string }
  | ({ kind: "escape-page" } & EscapePage);

/**
 * How to send a visitor to a short link's destination.
 *
 * - Desktop, iOS browsers and in-app browsers that already use the default
 *   browser: a 302 to the destination (universal links take it from there).
 * - Android: a 302 to an intent with the app's package when Nuto knows the
 *   app (Android opens it, or the web URL when it isn't installed), or for
 *   the default browser from inside an in-app browser.
 * - In-app browsers that need more (every iOS one, TikTok and WeChat on
 *   Android): the escape page, with the method utils/browser-escape.ts
 *   picks for that app.
 */
export function openDecision(destination: string, userAgent: string): OpenDecision {
  const { os, inApp } = detectApp(userAgent);
  if (os !== "ios" && os !== "android") return { kind: "redirect", location: destination };

  const url = new URL(destination);
  const app = findDeepLinkApp(url);
  const appIntent = os === "android" && app?.android ? androidIntent(url, app.android) : null;

  if (!inApp) return { kind: "redirect", location: appIntent ?? destination };

  const method = escapeMethod(destination, os, inApp.key);
  if (method.kind === "none") return { kind: "redirect", location: appIntent ?? destination };
  if (method.kind === "redirect") return { kind: "redirect", location: appIntent ?? method.url };

  const scheme = os === "ios" ? (app?.ios?.(url) ?? null) : null;
  return {
    kind: "escape-page",
    // On Android the app's own intent is the better first try when it exists
    auto: method.auto && appIntent ? appIntent : method.auto,
    tap: method.tap,
    destination,
    app: scheme && app ? { name: app.name, url: scheme } : null,
    inAppName: inApp.name,
  };
}
