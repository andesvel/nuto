import { describe, it, expect } from "vitest";
import { toAbsoluteUrl } from "../url";
import { isSelfReferential } from "../is-self-referential";

describe("toAbsoluteUrl", () => {
  it("keeps http(s) URLs and adds http:// to scheme-less ones", () => {
    expect(toAbsoluteUrl("https://a.com")).toBe("https://a.com");
    expect(toAbsoluteUrl("HTTP://a.com")).toBe("HTTP://a.com");
    expect(toAbsoluteUrl("a.com/x")).toBe("http://a.com/x");
    // The old startsWith("http") check let these through untouched
    expect(toAbsoluteUrl("httpbin.org")).toBe("http://httpbin.org");
  });
});

describe("isSelfReferential", () => {
  it("matches the same host (ignoring port) and slug", () => {
    expect(isSelfReferential("https://nuto.dev/abc", "abc", "nuto.dev")).toBe(true);
    expect(isSelfReferential("nuto.dev/abc/", "abc", "nuto.dev:443")).toBe(true);
  });

  it("ignores other hosts, other slugs and missing host headers", () => {
    expect(isSelfReferential("https://other.dev/abc", "abc", "nuto.dev")).toBe(false);
    expect(isSelfReferential("https://nuto.dev/xyz", "abc", "nuto.dev")).toBe(false);
    expect(isSelfReferential("https://nuto.dev/abc", "abc", null)).toBe(false);
  });
});
