import { describe, it, expect } from "vitest";
import { detectInAppBrowser } from "../in-app-escape";
import { escapeMethod } from "../browser-escape";

const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const IOS_INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 309.0.0.0.0 (iPhone15,2; iOS 17_0; en_US; en; scale=3.00; 1179x2556; 534961953)";
const ANDROID_TIKTOK =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230805.019; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 trill_330002 BytedanceWebview/d8a21c6";

describe("escapeMethod (inapp-debugger matrix)", () => {
  const url = "https://nuto.dev/es?x=1#faq";
  const safari = `x-safari-${url}`;
  const intent = "intent://nuto.dev/es?x=1#faq#Intent;scheme=https;end";

  it("iOS: each app's own way out, Safari where it works, nothing where it doesn't", () => {
    const ext = `instagram://extbrowser/?url=${encodeURIComponent(url)}`;
    expect(escapeMethod(url, "ios", "instagram")).toEqual({
      kind: "page",
      auto: ext,
      tap: { url: ext, mode: "link" },
    });
    expect(escapeMethod(url, "ios", "threads")).toMatchObject({
      auto: `barcelona://extbrowser/?url=${encodeURIComponent(url)}`,
    });
    // Facebook only lets Safari open through window.open, from a tap
    expect(escapeMethod(url, "ios", "facebook")).toEqual({
      kind: "page",
      auto: null,
      tap: { url: safari, mode: "window" },
    });
    for (const app of ["messenger", "telegram", "line", "linkedin", "gsa"]) {
      expect(escapeMethod(url, "ios", app), app).toEqual({
        kind: "page",
        auto: safari,
        tap: { url: safari, mode: "link" },
      });
    }
    for (const app of ["tiktok", "wechat", "twitter", "snapchat"]) {
      expect(escapeMethod(url, "ios", app), app).toEqual({ kind: "page", auto: null, tap: null });
    }
  });

  it("Android: intents where they work, a fallback where they don't", () => {
    for (const app of ["instagram", "facebook", "messenger", "threads", "telegram", "line"]) {
      expect(escapeMethod(url, "android", app), app).toEqual({ kind: "redirect", url: intent });
    }
    for (const app of ["snapchat", "linkedin", "twitter", "gsa"]) {
      expect(escapeMethod(url, "android", app), app).toEqual({ kind: "none" });
    }
    expect(escapeMethod(url, "android", "tiktok")).toEqual({
      kind: "page",
      auto: intent,
      tap: { url: intent, mode: "link" },
    });
    expect(escapeMethod(url, "android", "wechat")).toEqual({ kind: "page", auto: null, tap: null });
  });
});

describe("detectInAppBrowser", () => {
  it("recognizes mobile in-app browsers with their OS", () => {
    expect(detectInAppBrowser(IOS_INSTAGRAM)).toEqual({
      os: "ios",
      appKey: "instagram",
      appName: "Instagram",
    });
    expect(detectInAppBrowser(ANDROID_TIKTOK)?.os).toBe("android");
  });

  it("recognizes apps inapp-spy doesn't name", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]",
      ),
    ).toEqual({ os: "ios", appKey: "pinterest", appName: "Pinterest" });
  });

  it("ignores regular browsers and empty user agents", () => {
    expect(detectInAppBrowser(DESKTOP)).toBeNull();
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBeNull();
    expect(detectInAppBrowser("")).toBeNull();
  });
});
