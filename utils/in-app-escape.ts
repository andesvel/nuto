import type { MobileOs } from "./browser-escape";
import { detectApp } from "./in-app-detect";

/**
 * The in-app browser a request comes from (Instagram, TikTok, ...), on the
 * two platforms where Nuto knows how to leave it. Null for regular
 * browsers, desktop and unknown platforms. Used by the site itself; short
 * links go through utils/open-plan.ts.
 */
export function detectInAppBrowser(
  userAgent: string,
): { os: MobileOs; appKey: string; appName: string | null } | null {
  const { os, inApp } = detectApp(userAgent);
  if (!inApp || (os !== "ios" && os !== "android")) return null;
  return { os, appKey: inApp.key, appName: inApp.name };
}
