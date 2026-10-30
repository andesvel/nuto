import { redirect } from "react-router";
import { browserEscapeUrl } from "@/utils/browser-escape";
import { androidIntent } from "@/utils/deep-links";
import { detectInAppBrowser } from "@/utils/in-app-escape";

// Set on the first page served inside an in-app browser, for that browser
// session. Coming back to the app's browser (or an app that blocks the
// jump) then shows the page with its "Open in browser" banner, no loop.
const ESCAPE_COOKIE = "nuto_escape";

/**
 * Reopens a page of the site in the device's browser when it's first opened
 * inside an app's browser (Instagram, TikTok...). It has to be a server
 * redirect: these browsers follow a 302 to x-safari-https:// or intent://
 * but block the same navigation started from JavaScript without a tap.
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
    inApp.os === "ios" ? browserEscapeUrl(url.href, "ios") : androidIntent(url);
  return redirect(target, {
    headers: {
      "Set-Cookie": `${ESCAPE_COOKIE}=1; Path=/; SameSite=Lax; Secure; HttpOnly`,
      "Cache-Control": "no-store",
    },
  });
}
