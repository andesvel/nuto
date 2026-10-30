import { describe, it, expect } from "vitest";
import { androidIntent, DEEP_LINK_APPS, findDeepLinkApp } from "../deep-links";
import { redirectTarget } from "../open-plan";

const ios = (url: string) => {
  const parsed = new URL(url);
  return findDeepLinkApp(parsed)?.ios?.(parsed) ?? null;
};

describe("findDeepLinkApp", () => {
  it("matches hosts with or without www/m and subdomains, never look-alikes", () => {
    expect(findDeepLinkApp(new URL("https://www.youtube.com/watch?v=1"))?.key).toBe("youtube");
    expect(findDeepLinkApp(new URL("https://m.youtube.com/watch?v=1"))?.key).toBe("youtube");
    expect(findDeepLinkApp(new URL("https://music.youtube.com/watch?v=1"))?.key).toBe("youtube-music");
    expect(findDeepLinkApp(new URL("https://notyoutube.com/watch?v=1"))).toBeNull();
    expect(findDeepLinkApp(new URL("https://youtube.com.evil.com/"))).toBeNull();
    expect(findDeepLinkApp(new URL("https://www.google.com/maps/place/x"))?.key).toBe("google-maps");
    expect(findDeepLinkApp(new URL("https://www.google.com/search?q=x"))).toBeNull();
  });

  it("gives every app at least one way to open", () => {
    for (const app of DEEP_LINK_APPS) {
      expect(app.android || app.ios, app.key).toBeTruthy();
    }
  });
});

describe("iOS schemes", () => {
  it("exist only for near-universal apps, so nobody gets stuck without the app", () => {
    const withScheme = DEEP_LINK_APPS.filter((a) => a.ios).map((a) => a.key);
    expect(withScheme.sort()).toEqual(["spotify", "whatsapp", "youtube"]);
  });

  it("builds the documented scheme for each supported path", () => {
    expect(ios("https://youtu.be/abc")).toBe("youtube://watch?v=abc");
    expect(ios("https://www.youtube.com/shorts/abc")).toBe("youtube://shorts/abc");
    expect(ios("https://open.spotify.com/intl-es/playlist/37i")).toBe("spotify:playlist:37i");
    expect(ios("https://open.spotify.com/episode/9")).toBe("spotify:episode:9");
    expect(ios("https://wa.me/573001234567?text=hola")).toBe(
      "whatsapp://send?phone=573001234567&text=hola",
    );
  });

  it("returns null for paths without a reliable scheme", () => {
    expect(ios("https://open.spotify.com/")).toBeNull();
    expect(ios("https://chat.whatsapp.com/invite")).toBeNull();
  });
});

describe("androidIntent", () => {
  it("targets the app's package and falls back to the web URL", () => {
    expect(androidIntent(new URL("https://open.spotify.com/track/1?si=a"), "com.spotify.music")).toBe(
      "intent://open.spotify.com/track/1?si=a#Intent;scheme=https;package=com.spotify.music;S.browser_fallback_url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F1%3Fsi%3Da;end",
    );
  });

  it("hands other links to the default browser, keeping http", () => {
    expect(androidIntent(new URL("http://example.com/a"))).toBe(
      "intent://example.com/a#Intent;scheme=http;S.browser_fallback_url=http%3A%2F%2Fexample.com%2Fa;end",
    );
  });
});

const UA = {
  desktop:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  safari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
  instagramIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 309.0.0.0.0",
  tiktokAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 trill_330002 BytedanceWebview/d8a21c6",
};

describe("redirectTarget", () => {
  const SPOTIFY = "https://open.spotify.com/track/1";
  const NETFLIX = "https://www.netflix.com/title/80100172";
  const PLAIN = "https://example.com/page";

  it("sends desktop and iOS browsers straight to the destination", () => {
    expect(redirectTarget(SPOTIFY, UA.desktop)).toBe(SPOTIFY);
    expect(redirectTarget(SPOTIFY, UA.safari)).toBe(SPOTIFY);
    expect(redirectTarget(PLAIN, UA.safari)).toBe(PLAIN);
  });

  it("opens known apps on Android through a package intent with the web as fallback", () => {
    expect(redirectTarget(NETFLIX, UA.chromeAndroid)).toContain("package=com.netflix.mediaclient");
    expect(redirectTarget(NETFLIX, UA.tiktokAndroid)).toContain("S.browser_fallback_url=");
    expect(redirectTarget(PLAIN, UA.chromeAndroid)).toBe(PLAIN);
  });

  it("leaves Android in-app browsers for the default browser", () => {
    expect(redirectTarget(PLAIN, UA.tiktokAndroid)).toMatch(
      /^intent:\/\/example\.com\/page#Intent;scheme=https;S\.browser_fallback_url=/,
    );
  });

  it("leaves iOS in-app browsers for the app when it's near-universal, else Safari", () => {
    expect(redirectTarget(SPOTIFY, UA.instagramIos)).toBe("spotify:track:1");
    expect(redirectTarget(NETFLIX, UA.instagramIos)).toBe(`x-safari-${NETFLIX}`);
    expect(redirectTarget(PLAIN, UA.instagramIos)).toBe(`x-safari-${PLAIN}`);
  });
});
