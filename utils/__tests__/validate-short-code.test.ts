import { describe, it, expect } from "vitest";
import { validateShortCode, RESERVED_SLUGS } from "../validate-short-code";

describe("Short Code Validation", () => {
  it("V1: Validates a correct alphanumeric slug successfully", () => {
    const result = validateShortCode("mycustomslug123");
    expect(result.isValid).toBe(true);
    expect(result.hasValidChars).toBe(true);
    expect(result.isReserved).toBe(false);
  });

  it("V2: Identifies spaces and special characters as invalid syntax", () => {
    const result = validateShortCode("invalid slug!!");
    expect(result.isValid).toBe(false);
    expect(result.hasValidChars).toBe(false);
    expect(result.isReserved).toBe(false);
  });

  it("V3: Returns `isReserved: true` for Nuto internal dashboards and APIs", () => {
    const result = validateShortCode("api");
    expect(result.isValid).toBe(false);
    expect(result.hasValidChars).toBe(true);
    expect(result.isReserved).toBe(true);
  });

  it("V4: Flags common reserved URL keywords like 'login' or 'admin'", () => {
    const result = validateShortCode("admin");
    expect(result.isValid).toBe(false);
    expect(result.hasValidChars).toBe(true);
    expect(result.isReserved).toBe(true);
    expect(RESERVED_SLUGS.has("admin")).toBe(true);
  });
});
