import Bowser from "bowser";
import InAppSpy from "inapp-spy";

export type MobileOs = "ios" | "android";

// In-app browsers inapp-spy doesn't name. Checked before it, so these keys
// win over its generic "webview" verdict.
const EXTRA_APPS: { key: string; name: string; regex: RegExp }[] = [
  { key: "pinterest", name: "Pinterest", regex: /\bPinterest\//i },
  { key: "reddit", name: "Reddit", regex: /\bReddit\//i },
  { key: "discord", name: "Discord", regex: /\bDiscord\//i },
  { key: "telegram", name: "Telegram", regex: /\bTelegram(?:-Android)?\//i },
  { key: "kakaotalk", name: "KakaoTalk", regex: /\bKAKAOTALK\b/i },
];

export interface AppContext {
  os: MobileOs | "desktop" | "other";
  /** Set when the page runs inside an app's built-in browser */
  inApp: { key: string; name: string | null } | null;
}

/** Which OS family a user agent runs on and which app's browser, if any. */
export function detectApp(userAgent: string): AppContext {
  if (!userAgent) return { os: "other", inApp: null };
  const parser = Bowser.getParser(userAgent);
  const osName = parser.getOSName(true);
  const os: AppContext["os"] =
    osName === "ios" || osName === "android"
      ? osName
      : parser.getPlatformType(true) === "desktop"
        ? "desktop"
        : "other";

  const extra = EXTRA_APPS.find((app) => app.regex.test(userAgent));
  if (extra) return { os, inApp: { key: extra.key, name: extra.name } };

  const { isInApp, appKey, appName } = InAppSpy({ ua: userAgent });
  return {
    os,
    inApp: isInApp ? { key: appKey ?? "other", name: appName ?? null } : null,
  };
}
