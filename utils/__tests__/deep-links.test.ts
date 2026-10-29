import { describe, it, expect } from "vitest";
import { androidIntent, DEEP_LINK_APPS, findDeepLinkApp } from "../deep-links";
import { planOpen } from "../open-plan";

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
  it("builds the documented scheme for each supported path", () => {
    expect(ios("https://youtu.be/abc")).toBe("youtube://watch?v=abc");
    expect(ios("https://www.youtube.com/shorts/abc")).toBe("youtube://shorts/abc");
    expect(ios("https://open.spotify.com/intl-es/playlist/37i")).toBe("spotify:playlist:37i");
    expect(ios("https://open.spotify.com/episode/9")).toBe("spotify:episode:9");
    expect(ios("https://music.apple.com/us/album/x/1")).toBe("music://music.apple.com/us/album/x/1");
    expect(ios("https://www.twitch.tv/somechannel")).toBe("twitch://stream/somechannel");
    expect(ios("https://www.netflix.com/title/80100172")).toBe("nflx://www.netflix.com/title/80100172");
    expect(ios("https://www.instagram.com/nuto.dev/")).toBe("instagram://user?username=nuto.dev");
    expect(ios("https://x.com/jack/status/20")).toBe("twitter://status?id=20");
    expect(ios("https://wa.me/573001234567?text=hola")).toBe(
      "whatsapp://send?phone=573001234567&text=hola",
    );
    expect(ios("https://t.me/durov")).toBe("tg://resolve?domain=durov");
    expect(ios("https://www.amazon.com/dp/B0")).toBe(
      "com.amazon.mobile.shopping.web://www.amazon.com/dp/B0",
    );
  });

  it("leaves paths without a reliable scheme to universal links", () => {
    expect(ios("https://www.instagram.com/p/Cxyz/")).toBeNull();
    expect(ios("https://open.spotify.com/")).toBeNull();
    expect(ios("https://t.me/+invite")).toBeNull();
    expect(ios("https://www.tiktok.com/@user/video/1")).toBeNull();
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

describe("planOpen", () => {
  const SPOTIFY = "https://open.spotify.com/track/1";
  const PLAIN = "https://example.com/page";

  it("redirects desktop straight to the destination", () => {
    expect(planOpen(SPOTIFY, UA.desktop)).toEqual({ kind: "redirect", location: SPOTIFY });
  });

  it("opens apps from regular mobile browsers", () => {
    const android = planOpen(SPOTIFY, UA.chromeAndroid);
    expect(android.kind === "redirect" && android.location).toContain("package=com.spotify.music");
    expect(planOpen(PLAIN, UA.chromeAndroid)).toEqual({ kind: "redirect", location: PLAIN });

    // Safari tries the scheme, then the web if the app isn't installed
    expect(planOpen(SPOTIFY, UA.safari)).toMatchObject({
      kind: "page",
      steps: ["spotify:track:1"],
      fallback: SPOTIFY,
      targetApp: "Spotify",
    });
    expect(planOpen(PLAIN, UA.safari)).toEqual({ kind: "redirect", location: PLAIN });
  });

  it("inside iOS apps tries the app, then Safari, then explains", () => {
    expect(planOpen(SPOTIFY, UA.instagramIos)).toMatchObject({
      kind: "page",
      steps: ["spotify:track:1", `x-safari-${SPOTIFY}`],
      fallback: null,
      inAppName: "Instagram",
    });
    expect(planOpen(PLAIN, UA.instagramIos)).toMatchObject({
      steps: [`x-safari-${PLAIN}`],
      fallback: null,
    });
  });

  it("inside Android apps hands off with an intent and explains if blocked", () => {
    const plan = planOpen(PLAIN, UA.tiktokAndroid);
    expect(plan).toMatchObject({ kind: "page", fallback: null, inAppName: "TikTok" });
    expect(plan.kind === "page" && plan.steps[0]).toMatch(/^intent:\/\/example\.com\/page#Intent;scheme=https;/);
  });
});
