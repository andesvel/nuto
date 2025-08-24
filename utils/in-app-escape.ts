import Bowser from "bowser";

// thank you, Shalanah.
// https://github.com/shalanah/inapp-debugger/blob/main/src/sections/InappEscape.tsx

/**
 * Modifies a URL to escape in-app browsers on mobile devices (iOS and Android)
 * and force it to open in the default system browser.
 *
 * It parses the user agent string to determine the operating system.
 * - For iOS, it prepends `x-safari-` to the URL to open it in Safari.
 * - For Android, it converts the URL into an Android Intent format.
 * - For any other operating system or if an error occurs, it returns the original URL.
 *
 * @param long_url The original URL to be transformed.
 * @param userAgent The user agent string from the client's request headers.
 * @returns The modified URL formatted for the specific mobile OS, or the original URL as a fallback.
 */
export const inAppEscape = (long_url: string, userAgent: string): string => {
  const parser = Bowser.getParser(userAgent || "");
  const osName = (parser.getOSName(true) || "unknown") as
    | "ios"
    | "android"
    | string;
  const platformType = parser.getPlatformType(true); // 'mobile' | 'tablet' | 'desktop' | ...

  const safariHttps = "x-safari-";
  const androidIntentStart = "intent://";
  const androidIntentEnd = "#Intent;scheme=https;end";

  try {
    switch (osName) {
      case "ios": {
        const url = new URL(long_url);
        return safariHttps + url.toString();
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
