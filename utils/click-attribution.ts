import Bowser from "bowser";
import InAppSpy from "inapp-spy";

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
  if (!userAgent) return { source, app: null, device: "other" };

  const { isInApp, appKey } = InAppSpy({ ua: userAgent });
  const parser = Bowser.getParser(userAgent);
  const os = parser.getOSName(true);
  const platform = parser.getPlatformType(true);
  const device: ClickDevice =
    os === "ios"
      ? "ios"
      : os === "android"
        ? "android"
        : platform === "desktop"
          ? "desktop"
          : "other";

  return { source, app: isInApp ? (appKey ?? "other") : null, device };
}
