import { redirect } from "react-router";
import { androidIntent } from "@/utils/deep-links";
import { detectInAppBrowser } from "@/utils/in-app-escape";

// Set on the first page served inside an in-app browser, for that browser
// session. Coming back to the app's browser (or an app that blocks the
// jump) then shows the page with its "Open in browser" banner, no loop.
const ESCAPE_COOKIE = "nuto_escape";

/** Path of the iOS escape page for a page of this site. */
export const ESCAPE_PAGE_PATH = "/_open";

/**
 * Reopens a page of the site in the device's browser when it's first opened
 * inside an app's browser (Instagram, TikTok...). Android gets a 302 to an
 * intent; iOS goes through the escape page (app/routes/escape-page.ts),
 * because Instagram ignores a bare redirect to x-safari-https:// and every
 * app blocks escapes started from JavaScript.
 */
export function siteEscapeRedirect(request: Request): Response | null {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  // Client-side navigations fetch .data; only whole documents escape
  if (url.pathname.endsWith(".data")) return null;
  if ((request.headers.get("cookie") ?? "").includes(`${ESCAPE_COOKIE}=`)) return null;

  const inApp = detectInAppBrowser(request.headers.get("user-agent") ?? "");
  if (!inApp) return null;

  const target =
    inApp.os === "android"
      ? androidIntent(url)
      : `${ESCAPE_PAGE_PATH}?to=${encodeURIComponent(url.pathname + url.search)}`;
  return redirect(target, {
    headers: {
      "Set-Cookie": `${ESCAPE_COOKIE}=1; Path=/; SameSite=Lax; Secure; HttpOnly`,
      "Cache-Control": "no-store",
    },
  });
}
