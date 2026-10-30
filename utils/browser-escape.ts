// How to leave each app's in-app browser, following the inapp-debugger
// matrix (github.com/shalanah/inapp-debugger, updated March 2026) plus
// Instagram's extbrowser link. Bowser-free so the client banner can use it;
// the OS and app key come from the server (utils/in-app-detect.ts).
//
// Escapes only work from a server redirect, a meta refresh while the page
// loads, or a tap. Started from JavaScript on their own, they're dropped.

export type MobileOs = "ios" | "android";

export type EscapeMethod =
  /** The app already opens links in the default browser: nothing to do */
  | { kind: "none" }
  /** A server redirect is enough (Android intents) */
  | { kind: "redirect"; url: string }
  /**
   * The escape page: `auto` is tried with a meta refresh (null when the app
   * is known to block it), `tap` is offered as a button (null when nothing
   * works and only the app's menu can get the visitor out). "window" taps
   * must go through window.open, the only way Facebook lets Safari open.
   */
  | {
      kind: "page";
      auto: string | null;
      tap: { url: string; mode: "link" | "window" } | null;
    };

// iOS: Safari scheme ❌ and browser scheme ❌ (Snapchat: Chrome http only)
const IOS_BLOCKED = new Set(["tiktok", "wechat", "twitter", "snapchat"]);
// Android: these already open links in the default browser or a custom tab
const ANDROID_DEFAULT_BROWSER = new Set(["snapchat", "linkedin", "twitter", "gsa"]);
// Android: intent ❌ / "not dependable"
const ANDROID_BLOCKED = new Set(["wechat"]);
const ANDROID_UNRELIABLE = new Set(["tiktok"]);

/** intent:// for the default browser, keeping http targets on http. */
export function browserIntent(url: string): string {
  const parsed = new URL(url);
  const scheme = parsed.protocol.replace(":", "");
  const rest = parsed.toString().replace(/^https?:\/\//, "");
  return `intent://${rest}#Intent;scheme=${scheme};end`;
}

/**
 * How to get `url` out of the in-app browser of `appKey` on `os` and into
 * the device's own browser. Throws on an unparsable URL.
 */
export function escapeMethod(url: string, os: MobileOs, appKey?: string | null): EscapeMethod {
  const href = new URL(url).toString();
  const key = appKey ?? "";

  if (os === "android") {
    if (ANDROID_DEFAULT_BROWSER.has(key)) return { kind: "none" };
    if (ANDROID_BLOCKED.has(key)) return { kind: "page", auto: null, tap: null };
    const intent = browserIntent(href);
    if (ANDROID_UNRELIABLE.has(key)) {
      return { kind: "page", auto: intent, tap: { url: intent, mode: "link" } };
    }
    return { kind: "redirect", url: intent };
  }

  if (IOS_BLOCKED.has(key)) return { kind: "page", auto: null, tap: null };
  const safari = `x-safari-${href}`;
  if (key === "instagram") {
    const ext = `instagram://extbrowser/?url=${encodeURIComponent(href)}`;
    return { kind: "page", auto: ext, tap: { url: ext, mode: "link" } };
  }
  if (key === "threads") {
    const ext = `barcelona://extbrowser/?url=${encodeURIComponent(href)}`;
    return { kind: "page", auto: ext, tap: { url: ext, mode: "link" } };
  }
  if (key === "facebook") {
    return { kind: "page", auto: null, tap: { url: safari, mode: "window" } };
  }
  return { kind: "page", auto: safari, tap: { url: safari, mode: "link" } };
}
