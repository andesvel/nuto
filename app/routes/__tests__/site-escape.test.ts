import { describe, it, expect } from "vitest";
import { siteEscapeRedirect } from "../../lib/site-escape.server";

const IG_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 309.0.0.0.0";
const TIKTOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UD1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 trill_330002 BytedanceWebview/d8a21c6";
const SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const get = (path: string, ua: string, cookie?: string) =>
  new Request(`https://nuto.dev${path}`, {
    headers: { "user-agent": ua, ...(cookie ? { cookie } : {}) },
  });

describe("siteEscapeRedirect", () => {
  it("redirects the first page in an in-app browser to the device's browser", () => {
    const ios = siteEscapeRedirect(get("/es?x=1", IG_IOS))!;
    expect(ios.status).toBe(302);
    expect(ios.headers.get("Location")).toBe("x-safari-https://nuto.dev/es?x=1");
    expect(ios.headers.get("Set-Cookie")).toContain("nuto_escape=1");

    const android = siteEscapeRedirect(get("/", TIKTOK_ANDROID))!;
    expect(android.headers.get("Location")).toMatch(/^intent:\/\/nuto\.dev\/#Intent;scheme=https;/);
  });

  it("never loops, and leaves regular browsers and data requests alone", () => {
    expect(siteEscapeRedirect(get("/", IG_IOS, "nuto_escape=1"))).toBeNull();
    expect(siteEscapeRedirect(get("/", SAFARI))).toBeNull();
    expect(siteEscapeRedirect(get("/dashboard.data", IG_IOS))).toBeNull();
    expect(
      siteEscapeRedirect(new Request("https://nuto.dev/", { method: "POST", headers: { "user-agent": IG_IOS } })),
    ).toBeNull();
  });
});
