import { describe, it, expect } from "vitest";
import {
  MAX_LONG_URL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_SHORT_CODE_LENGTH,
  normalizeLongUrl,
  readTextField,
  validateExpiresAt,
  validatePasswordInput,
  validateShortCodeInput,
} from "../validate-link-input";

describe("validate-link-input", () => {
  it("readTextField ignores files and missing fields", () => {
    const form = new FormData();
    form.set("text", "value");
    form.set("file", new File(["x"], "x.txt"));

    expect(readTextField(form, "text")).toBe("value");
    expect(readTextField(form, "file")).toBe("");
    expect(readTextField(form, "missing")).toBe("");
  });

  it("validateShortCodeInput enforces charset, reserved words and length", () => {
    expect(validateShortCodeInput(" abc123 ")).toEqual({ ok: true, value: "abc123" });
    expect(validateShortCodeInput("a-b").ok).toBe(false);
    expect(validateShortCodeInput("dashboard").ok).toBe(false);
    expect(validateShortCodeInput("a".repeat(MAX_SHORT_CODE_LENGTH)).ok).toBe(true);
    expect(validateShortCodeInput("a".repeat(MAX_SHORT_CODE_LENGTH + 1)).ok).toBe(false);
  });

  it("normalizeLongUrl adds a scheme and only allows http(s)", () => {
    expect(normalizeLongUrl("example.com/path")).toEqual({
      ok: true,
      value: "http://example.com/path",
    });
    expect(normalizeLongUrl("https://example.com")).toEqual({
      ok: true,
      value: "https://example.com/",
    });
    expect(normalizeLongUrl("javascript:alert(1)").ok).toBe(false);
    expect(normalizeLongUrl("data:text/html,hi").ok).toBe(false);
    expect(normalizeLongUrl("ftp://example.com").ok).toBe(false);
    expect(normalizeLongUrl("http://").ok).toBe(false);
    expect(
      normalizeLongUrl(`https://example.com/${"a".repeat(MAX_LONG_URL_LENGTH)}`).ok,
    ).toBe(false);
  });

  it("validateExpiresAt accepts empty or future dates only", () => {
    const now = Date.UTC(2026, 0, 1);
    expect(validateExpiresAt("", now)).toEqual({ ok: true, value: null });
    expect(validateExpiresAt("not a date", now).ok).toBe(false);
    expect(validateExpiresAt(new Date(now - 1000).toISOString(), now).ok).toBe(false);
    expect(validateExpiresAt(new Date(now + 30_000).toISOString(), now).ok).toBe(false);

    const future = new Date(now + 86_400_000).toISOString();
    expect(validateExpiresAt(future, now)).toEqual({ ok: true, value: future });
  });

  it("validatePasswordInput caps the length", () => {
    expect(validatePasswordInput("").ok).toBe(true);
    expect(validatePasswordInput("a".repeat(MAX_PASSWORD_LENGTH)).ok).toBe(true);
    expect(validatePasswordInput("a".repeat(MAX_PASSWORD_LENGTH + 1)).ok).toBe(false);
  });
});
