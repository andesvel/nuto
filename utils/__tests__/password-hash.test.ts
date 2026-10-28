import { describe, it, expect } from "vitest";
import {
  PBKDF2_ITERATIONS,
  hashLinkPassword,
  verifyLinkPassword,
} from "../password-hash";

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("password-hash", () => {
  it("produces salted PBKDF2 hashes that differ for the same password", async () => {
    const a = await hashLinkPassword("secret");
    const b = await hashLinkPassword("secret");

    expect(a.startsWith(`pbkdf2-sha256$${PBKDF2_ITERATIONS}$`)).toBe(true);
    expect(a).not.toBe(b);
  });

  it("verifies PBKDF2 hashes without asking for a re-hash", async () => {
    const stored = await hashLinkPassword("secret");

    expect(await verifyLinkPassword("secret", stored)).toEqual({
      valid: true,
      needsRehash: false,
    });
    expect(await verifyLinkPassword("wrong", stored)).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it("verifies legacy SHA-256 hashes and flags them for re-hash", async () => {
    const legacy = await sha256Hex("secret");

    expect(await verifyLinkPassword("secret", legacy)).toEqual({
      valid: true,
      needsRehash: true,
    });
    expect(await verifyLinkPassword("wrong", legacy)).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it("rejects malformed PBKDF2 strings", async () => {
    expect(
      await verifyLinkPassword("secret", "pbkdf2-sha256$abc$$"),
    ).toEqual({ valid: false, needsRehash: false });
  });
});
