import { describe, it, expect } from "vitest";
import { detectInAppBrowser } from "../in-app-escape";
import { browserEscapeUrl } from "../browser-escape";

const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const IOS_INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 309.0.0.0.0 (iPhone15,2; iOS 17_0; en_US; en; scale=3.00; 1179x2556; 534961953)";
const ANDROID_TIKTOK =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A.230805.019; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 trill_330002 BytedanceWebview/d8a21c6";

describe("browserEscapeUrl", () => {
  it("hands the page to Safari on iOS and the default browser on Android", () => {
    expect(browserEscapeUrl("https://nuto.dev/es?x=1#faq", "ios")).toBe(
      "x-safari-https://nuto.dev/es?x=1#faq",
    );
    expect(browserEscapeUrl("https://nuto.dev/es?x=1#faq", "android")).toBe(
      "intent://nuto.dev/es?x=1#faq#Intent;scheme=https;end",
    );
  });
});

describe("detectInAppBrowser", () => {
  it("recognizes mobile in-app browsers with their OS", () => {
    expect(detectInAppBrowser(IOS_INSTAGRAM)).toEqual({
      os: "ios",
      appName: "Instagram",
    });
    expect(detectInAppBrowser(ANDROID_TIKTOK)?.os).toBe("android");
  });

  it("recognizes apps inapp-spy doesn't name", () => {
    expect(
      detectInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [Pinterest/iOS]",
      ),
    ).toEqual({ os: "ios", appName: "Pinterest" });
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
