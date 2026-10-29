import { detectApp } from "./in-app-detect";

export type ClickDevice = "ios" | "android" | "desktop" | "other";

export interface ClickAttribution {
  /** "qr" when the visit came from a Nuto QR code (the ?q marker) */
  source: "qr" | null;
  /** The in-app browser's key (instagram, tiktok...), null in a regular browser */
  app: string | null;
  device: ClickDevice;
}

/**
 * Derives the analytics dimensions of a click from its URL and user agent.
 * Done once at click time so the dashboard never parses user agents.
 */
export function attributeClick(url: URL, userAgent: string): ClickAttribution {
  const source = url.searchParams.has("q") ? "qr" : null;
  const { os, inApp } = detectApp(userAgent);
  return { source, app: inApp?.key ?? null, device: os };
}
