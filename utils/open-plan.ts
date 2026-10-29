import { browserEscapeUrl } from "./browser-escape";
import { androidIntent, findDeepLinkApp } from "./deep-links";
import { detectApp } from "./in-app-detect";

/**
 * How to send a visitor to a short link's destination:
 * - a plain 302 (desktop, or nothing better to do), or
 * - the open page, which tries `steps` in order (app scheme, then leaving
 *   the in-app browser), stops as soon as one takes the visitor away, and
 *   finally either loads `fallback` or, inside an app that blocks every
 *   attempt, shows how to open the link in the browser by hand.
 */
export type OpenPlan =
  | { kind: "redirect"; location: string }
  | {
      kind: "page";
      steps: string[];
      fallback: string | null;
      destination: string;
      /** App the destination opens in (YouTube, Spotify...) */
      targetApp: string | null;
      /** In-app browser the visitor is in (Instagram, TikTok...) */
      inAppName: string | null;
    };

export function planOpen(destination: string, userAgent: string): OpenPlan {
  const { os, inApp } = detectApp(userAgent);
  if (os !== "ios" && os !== "android") return { kind: "redirect", location: destination };

  const url = new URL(destination);
  const app = findDeepLinkApp(url);
  const page = (steps: string[], fallback: string | null): OpenPlan => ({
    kind: "page",
    steps,
    fallback,
    destination,
    targetApp: app?.name ?? null,
    inAppName: inApp ? (inApp.name ?? null) : null,
  });

  if (os === "android") {
    // The intent carries the web URL as fallback, so Android itself picks
    // the app when it's installed and the page when it isn't
    const intent = androidIntent(url, app?.android);
    if (inApp) return page([intent], null);
    return app?.android ? { kind: "redirect", location: intent } : { kind: "redirect", location: destination };
  }

  const scheme = app?.ios?.(url) ?? null;
  if (inApp) {
    // Try the app first, then Safari; if the app blocks both, explain
    return page([scheme, browserEscapeUrl(destination, "ios")].filter(Boolean) as string[], null);
  }
  // In Safari a missing app would show an error, so the page falls back to
  // the web after the attempt
  return scheme ? page([scheme], destination) : { kind: "redirect", location: destination };
}
