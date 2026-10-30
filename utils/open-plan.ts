import { browserEscapeUrl } from "./browser-escape";
import { androidIntent, findDeepLinkApp } from "./deep-links";
import { detectApp } from "./in-app-detect";

export type OpenDecision =
  | { kind: "redirect"; location: string }
  | {
      /** iOS in-app browsers: see app/lib/escape-page.server.ts */
      kind: "escape-page";
      escapeUrl: string;
      destination: string;
      /** The destination's app, when it has a scheme worth offering */
      app: { name: string; url: string } | null;
      inAppName: string | null;
    };

/**
 * How to send a visitor to a short link's destination.
 *
 * - Desktop and iOS browsers: a 302 to the destination (universal links
 *   take it from there).
 * - Android: a 302 to an intent with the app's package when Nuto knows the
 *   app (Android opens it, or the web URL when it isn't installed), or for
 *   the default browser from inside an in-app browser.
 * - iOS in-app browsers: the escape page. A bare 302 to x-safari-https:// is
 *   ignored by Instagram nowadays; the page tries the app-specific escape
 *   declaratively (meta refresh) and keeps tap targets, which every app
 *   honours. Escapes started from JavaScript without a tap are blocked, so
 *   none of this may move to client code.
 */
export function openDecision(destination: string, userAgent: string): OpenDecision {
  const { os, inApp } = detectApp(userAgent);
  if (os !== "ios" && os !== "android") return { kind: "redirect", location: destination };

  const url = new URL(destination);
  const app = findDeepLinkApp(url);

  if (os === "android") {
    if (app?.android) return { kind: "redirect", location: androidIntent(url, app.android) };
    return { kind: "redirect", location: inApp ? androidIntent(url) : destination };
  }

  if (!inApp) return { kind: "redirect", location: destination };
  const scheme = app?.ios?.(url) ?? null;
  return {
    kind: "escape-page",
    escapeUrl: browserEscapeUrl(destination, "ios", inApp.key),
    destination,
    app: scheme && app ? { name: app.name, url: scheme } : null,
    inAppName: inApp.name,
  };
}
