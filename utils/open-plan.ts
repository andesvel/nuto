import { browserEscapeUrl } from "./browser-escape";
import { androidIntent, findDeepLinkApp } from "./deep-links";
import { detectApp } from "./in-app-detect";

/**
 * Where to redirect (302) a visitor for a short link's destination.
 *
 * Always a server redirect: in-app browsers (Instagram, TikTok...) follow a
 * 302 to x-safari-https:// or intent://, but block the same navigation when
 * a page triggers it from JavaScript without a tap.
 *
 * - Desktop and iOS browsers: the destination itself (universal links take
 *   it from there).
 * - Android, in-app or not: an intent with the app's package when Nuto
 *   knows the app (Android opens the app or, without it, the web URL), or
 *   with no package inside an in-app browser to reach the default browser.
 * - iOS in-app browsers: the app's scheme for apps nearly everyone has
 *   (a missing app would leave the visitor stuck), otherwise Safari.
 */
export function redirectTarget(destination: string, userAgent: string): string {
  const { os, inApp } = detectApp(userAgent);
  if (os !== "ios" && os !== "android") return destination;

  const url = new URL(destination);
  const app = findDeepLinkApp(url);

  if (os === "android") {
    if (app?.android) return androidIntent(url, app.android);
    return inApp ? androidIntent(url) : destination;
  }

  if (!inApp) return destination;
  return app?.ios?.(url) ?? browserEscapeUrl(destination, "ios");
}
