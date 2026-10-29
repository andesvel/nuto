import { describe, it, expect } from "vitest";
import { buildCsp, clerkFrontendApi, createNonce } from "../csp";

describe("clerkFrontendApi", () => {
  it("decodes the host from test and live publishable keys", () => {
    const key = (host: string, kind = "test") => `pk_${kind}_${btoa(`${host}$`)}`;
    expect(clerkFrontendApi(key("fine-ant-12.clerk.accounts.dev"))).toBe(
      "fine-ant-12.clerk.accounts.dev",
    );
    expect(clerkFrontendApi(key("clerk.nuto.dev", "live"))).toBe("clerk.nuto.dev");
  });

  it("rejects anything that isn't a publishable key with a hostname", () => {
    expect(clerkFrontendApi(undefined)).toBeNull();
    expect(clerkFrontendApi("sk_test_abc")).toBeNull();
    expect(clerkFrontendApi(`pk_test_${btoa("evil.com; script-src *$")}`)).toBeNull();
  });
});

describe("buildCsp", () => {
  it("allows scripts only from self, the nonce, Clerk and Turnstile", () => {
    const csp = buildCsp({ nonce: "abc123", clerkHost: "clerk.nuto.dev" });
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"));
    expect(scriptSrc).toContain("'nonce-abc123'");
    expect(scriptSrc).toContain("https://clerk.nuto.dev");
    expect(scriptSrc).toContain("https://challenges.cloudflare.com");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("still builds without a Clerk host", () => {
    expect(buildCsp({ nonce: "n", clerkHost: null })).not.toContain("https://undefined");
  });
});

describe("createNonce", () => {
  it("returns a fresh 128-bit base64 value each time", () => {
    const a = createNonce();
    expect(atob(a)).toHaveLength(16);
    expect(createNonce()).not.toBe(a);
  });
});
