// Bowser-free so it can ship to the client: the OS and app come from the
// server's user-agent parsing (see utils/in-app-detect.ts).

export type MobileOs = "ios" | "android";

/**
 * A URL that makes an in-app browser hand `url` to the device's own
 * browser. Throws on an unparsable URL.
 *
 * - Instagram and Threads (iOS) ignore x-safari-https:// since 2025-2026
 *   but honour their own extbrowser deep link, after a confirmation.
 * - Other iOS apps: Safari through x-safari-https://.
 * - Android: an intent for the default browser that keeps the scheme.
 */
export function browserEscapeUrl(url: string, os: MobileOs, appKey?: string | null): string {
  const parsed = new URL(url);
  if (os === "ios") {
    if (appKey === "instagram") {
      return `instagram://extbrowser/?url=${encodeURIComponent(parsed.toString())}`;
    }
    if (appKey === "threads") {
      return `barcelona://extbrowser/?url=${encodeURIComponent(parsed.toString())}`;
    }
    return "x-safari-" + parsed.toString();
  }
  // Keep the original scheme so http-only targets still load
  const scheme = parsed.protocol.replace(":", "");
  const rest = parsed.toString().replace(/^https?:\/\//, "");
  return `intent://${rest}#Intent;scheme=${scheme};end`;
}
