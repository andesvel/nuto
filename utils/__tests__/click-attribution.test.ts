import { describe, it, expect } from "vitest";
import { attributeClick } from "../click-attribution";

const IG_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 309.0.0.0.0 (iPhone15,2; iOS 17_0; en_US; en; scale=3.00; 1179x2556; 534961953)";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("attributeClick", () => {
  it("marks QR scans by the ?q marker", () => {
    expect(attributeClick(new URL("https://nuto.dev/abc?q"), DESKTOP).source).toBe("qr");
    expect(attributeClick(new URL("https://nuto.dev/abc"), DESKTOP).source).toBeNull();
  });

  it("records the in-app browser and the device family", () => {
    expect(attributeClick(new URL("https://nuto.dev/a"), IG_IOS)).toEqual({
      source: null,
      app: "instagram",
      device: "ios",
    });
    expect(attributeClick(new URL("https://nuto.dev/a"), CHROME_ANDROID)).toMatchObject({
      app: null,
      device: "android",
    });
    expect(attributeClick(new URL("https://nuto.dev/a"), DESKTOP).device).toBe("desktop");
    expect(attributeClick(new URL("https://nuto.dev/a"), "").device).toBe("other");
  });
});
