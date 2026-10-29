import { describe, it, expect } from "vitest";
import { encode } from "uqr";
import { QR_QUIET_ZONE, qrFileName, qrSvg } from "../qr";

const URL_TEXT = "https://nuto.dev/abc123?q";
const plain = { foreground: "#000000", background: "#ffffff", logo: false };

const moduleCount = (svg: string) =>
  (svg.match(/h1v1h-1z/g) ?? []).length;

describe("qrSvg", () => {
  it("adds the quiet zone around the code", () => {
    const { size } = encode(URL_TEXT, { ecc: "M", border: 0 });
    const svg = qrSvg(URL_TEXT, plain);
    const total = size + QR_QUIET_ZONE * 2;
    expect(svg).toContain(`viewBox="0 0 ${total} ${total}"`);
    // No module is drawn inside the quiet zone
    expect(svg).not.toMatch(new RegExp(`M[0-${QR_QUIET_ZONE - 1}] `));
  });

  it("draws every dark module once without a logo", () => {
    const { data } = encode(URL_TEXT, { ecc: "M", border: 0 });
    const dark = data.flat().filter(Boolean).length;
    expect(moduleCount(qrSvg(URL_TEXT, plain))).toBe(dark);
  });

  it("clears the center for the logo and uses high error correction", () => {
    const withLogo = qrSvg(URL_TEXT, { ...plain, logo: true });
    const { data } = encode(URL_TEXT, { ecc: "H", border: 0 });
    const dark = data.flat().filter(Boolean).length;
    expect(moduleCount(withLogo)).toBeLessThan(dark);
    // Under 30% of the modules are hidden, so H can still recover them
    expect(moduleCount(withLogo)).toBeGreaterThan(dark * 0.7);
    expect(withLogo).toContain("scale(");
  });

  it("omits the background rect when transparent", () => {
    const svg = qrSvg(URL_TEXT, { ...plain, background: null });
    expect(svg).not.toContain('fill="#ffffff"');
  });
});

describe("qrFileName", () => {
  it("names files after the short code, filesystem-safe", () => {
    expect(qrFileName("abc123", "png")).toBe("nuto-abc123.png");
    expect(qrFileName("a/b c", "svg")).toBe("nuto-a_b_c.svg");
    expect(qrFileName("", "png")).toBe("nuto-link.png");
  });
});
