import { describe, it, expect } from "vitest";
import { inAppEscape } from "../in-app-escape";

const IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("inAppEscape", () => {
  it("opens YouTube and Spotify links in their iOS apps", () => {
    expect(inAppEscape("https://www.youtube.com/watch?v=abc", IOS)).toBe(
      "youtube://watch?v=abc",
    );
    expect(inAppEscape("https://open.spotify.com/track/123", IOS)).toBe(
      "spotify:track:123",
    );
  });

  it("forces Safari for other iOS links", () => {
    expect(inAppEscape("https://example.com/a", IOS)).toBe(
      "x-safari-https://example.com/a",
    );
    expect(inAppEscape("https://open.spotify.com/user/x", IOS)).toBe(
      "x-safari-https://open.spotify.com/user/x",
    );
  });

  it("builds Android intents that keep the original scheme", () => {
    expect(inAppEscape("https://example.com/a?b=1", ANDROID)).toBe(
      "intent://example.com/a?b=1#Intent;scheme=https;end",
    );
    expect(inAppEscape("http://example.com/a", ANDROID)).toBe(
      "intent://example.com/a#Intent;scheme=http;end",
    );
  });

  it("leaves other platforms and unparsable URLs untouched", () => {
    expect(inAppEscape("https://example.com", DESKTOP)).toBe("https://example.com");
    expect(inAppEscape("not a url", IOS)).toBe("not a url");
  });
});
