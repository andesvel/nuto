import { describe, it, expect } from "vitest";
import {
  ACCESS_COOKIE_MAX_AGE,
  createAccessCookie,
  hasValidAccessCookie,
  passwordFingerprint,
  readCookieValues,
} from "../link-access";

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
const OTHER_KEY = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));

function cookiePair(setCookie: string) {
  return setCookie.split(";")[0];
}

describe("link-access", () => {
  it("passwordFingerprint is stable and differs per hash", async () => {
    const a = await passwordFingerprint("hash-a");
    expect(a).toBe(await passwordFingerprint("hash-a"));
    expect(a).not.toBe(await passwordFingerprint("hash-b"));
    expect(a).not.toContain("hash-a");
  });

  it("accepts a cookie it issued for the same slug and fingerprint", async () => {
    const fp = await passwordFingerprint("hash");
    const setCookie = await createAccessCookie("slug", fp, KEY, { secure: true });

    expect(setCookie).toContain("Path=/slug");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(await hasValidAccessCookie(cookiePair(setCookie), "slug", fp, KEY)).toBe(true);
  });

  it("rejects cookies for another slug, password, key or a tampered signature", async () => {
    const fp = await passwordFingerprint("hash");
    const pair = cookiePair(
      await createAccessCookie("slug", fp, KEY, { secure: false }),
    );

    // Same value replayed under another slug's name
    const otherSlug = pair.replace("pw_slug=", "pw_other=");
    expect(await hasValidAccessCookie(otherSlug, "other", fp, KEY)).toBe(false);
    // Password changed
    const newFp = await passwordFingerprint("new-hash");
    expect(await hasValidAccessCookie(pair, "slug", newFp, KEY)).toBe(false);
    // Different signing key
    expect(await hasValidAccessCookie(pair, "slug", fp, OTHER_KEY)).toBe(false);
    // Tampered signature
    expect(await hasValidAccessCookie(pair.slice(0, -2) + "xx", "slug", fp, KEY)).toBe(false);
    // Legacy verifier format
    expect(await hasValidAccessCookie("pw_slug=0123456789abcdef", "slug", fp, KEY)).toBe(false);
  });

  it("rejects an expired cookie even if the browser still sends it", async () => {
    const fp = await passwordFingerprint("hash");
    const issuedAt = Date.now() - (ACCESS_COOKIE_MAX_AGE + 1) * 1000;
    const pair = cookiePair(
      await createAccessCookie("slug", fp, KEY, { secure: false, now: issuedAt }),
    );

    expect(await hasValidAccessCookie(pair, "slug", fp, KEY)).toBe(false);
  });

  it("accepts the valid value when an old cookie with the same name is also sent", async () => {
    const fp = await passwordFingerprint("hash");
    const pair = cookiePair(await createAccessCookie("slug", fp, KEY, { secure: false }));
    const header = `pw_slug=legacyverifier; ${pair}`;

    expect(await hasValidAccessCookie(header, "slug", fp, KEY)).toBe(true);
  });

  it("readCookieValues matches names exactly", () => {
    const header = "xpw_a=1; pw_ab=2; pw_a=3";
    expect(readCookieValues(header, "pw_a")).toEqual(["3"]);
    expect(readCookieValues(null, "pw_a")).toEqual([]);
  });
});
