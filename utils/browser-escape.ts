// Bowser-free so it can ship to the client: the OS comes from the server's
// user-agent parsing (see detectInAppBrowser in in-app-escape.ts).

export type MobileOs = "ios" | "android";

/**
 * A URL that makes an in-app browser hand `url` to the device's own
 * browser: Safari on iOS (x-safari-https://…), the default browser on
 * Android (an intent that keeps the original scheme). Throws on an
 * unparsable URL.
 */
export function browserEscapeUrl(url: string, os: MobileOs): string {
  const parsed = new URL(url);
  if (os === "ios") return "x-safari-" + parsed.toString();
  // Keep the original scheme so http-only targets still load
  const scheme = parsed.protocol.replace(":", "");
  const rest = parsed.toString().replace(/^https?:\/\//, "");
  return `intent://${rest}#Intent;scheme=${scheme};end`;
}
