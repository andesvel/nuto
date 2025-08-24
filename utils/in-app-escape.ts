import Bowser from "bowser";

// thank you, Shalanah.
// https://github.com/shalanah/inapp-debugger/blob/main/src/sections/InappEscape.tsx

/**
 * Transforms a standard HTTPS URL into a mobile-specific URI scheme designed to
 * "escape" in-app browsers (like those in Instagram, Facebook, etc.) and open
 * the link in the native system browser or a specific native application.
 *
 * @remarks
 * The function uses the user agent string to detect the operating system.
 * - For **iOS**, it prepends `x-safari-` to force opening in Safari. It also includes
 *   special handling for YouTube and Spotify URLs to generate their respective
 *   deep link URIs (e.g., `youtube://` or `spotify:track:id`).
 * - For **Android**, it converts the URL into an Android Intent format, which
 *   prompts the system to open the link in an external application (usually the
 *   default browser).
 * - For any other OS or in case of an error during processing, it returns the
 *   original URL unmodified.
 *
 * @param long_url - The original, standard URL (e.g., "https://www.youtube.com/watch?v=...").
 * @param userAgent - The user agent string of the client's browser.
 * @returns The transformed URL for iOS/Android, or the original URL as a fallback.
 *
 * @example
 * ```typescript
 * // iOS YouTube example
 * const iosUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) ...";
 * const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
 * inAppEscape(youtubeUrl, iosUserAgent);
 * // Returns: "youtube://watch?v=dQw4w9WgXcQ"
 *
 * // iOS Spotify example
 * const spotifyUrl = "https://open.spotify.com/track/2apgh31Z225FlQoAgiDg91";
 * inAppEscape(spotifyUrl, iosUserAgent);
 * // Returns: "spotify:track:4cOdK2wGLETOMhOcdqokD2"
 *
 * // Android example
 * const androidUserAgent = "Mozilla/5.0 (Linux; Android 11; Pixel 5) ...";
 * const anyUrl = "https://example.com/some/path";
 * inAppEscape(anyUrl, androidUserAgent);
 * // Returns: "intent://example.com/some/path#Intent;scheme=https;end"
 *
 * // Fallback example
 * const desktopUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...";
 * inAppEscape(anyUrl, desktopUserAgent);
 * // Returns: "https://example.com/some/path"
 * ```
 */
export const inAppEscape = (long_url: string, userAgent: string): string => {
  const parser = Bowser.getParser(userAgent || "");
  const osName = (parser.getOSName(true) || "unknown") as
    | "ios"
    | "android"
    | string;

  const hostname = new URL(long_url).hostname.toLowerCase();
  const safariHttps = "x-safari-";
  const androidIntentStart = "intent://";
  const androidIntentEnd = "#Intent;scheme=https;end";

  try {
    switch (osName) {
      case "ios": {
        const url = new URL(long_url);

        // Handle to open specific apps directly

        // YouTube
        if (hostname.includes("youtube") || hostname.includes("youtu.be")) {
          const newUrl = url.pathname + url.search + url.hash;
          return "youtube://" + newUrl.substring(1);
          // Spotify
        } else if (hostname.includes("spotify.com")) {
          const pathParts = url.pathname.split("/").filter(Boolean); // e.g., ['artist', 'artistId']
          if (
            pathParts.length >= 2 &&
            ["artist", "track", "album"].includes(pathParts[0])
          ) {
            const [type, id] = pathParts;
            return `spotify:${type}:${id}`;
          }
          // Fallback for other spotify links
          return safariHttps + url.toString();
        } else {
          return safariHttps + url.toString();
        }
      }
      case "android": {
        const url = new URL(long_url);
        const replaced = url
          .toString()
          .replace(/^https?:\/\//, androidIntentStart);
        return replaced + androidIntentEnd;
      }
      default:
        return long_url;
    }
  } catch (error) {
    console.error("Error in inAppEscape:", error);
    return long_url;
  }
};
