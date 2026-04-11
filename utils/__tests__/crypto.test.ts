import { describe, it, expect } from "vitest";
import { encryptPassword, decryptPassword } from "../crypto";

describe("Crypto Utilities (AES-GCM)", () => {
  const MOCK_ENV_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // 32 bytes base64 encoded null-key for tests

  it("V1: Validates symmetric encryption returns different strings due to IV randomness", async () => {
    const originalText = "MySuperSecretPassword_123*";

    // Encrypting twice exactly same plaintext
    const hashA = await encryptPassword(originalText, MOCK_ENV_KEY);
    const hashB = await encryptPassword(originalText, MOCK_ENV_KEY);

    expect(hashA).not.toBe(hashB);
    expect(hashA).toContain("."); // format: `iv.ct`
    expect(hashB).toContain(".");
  });

  it("V2: Correctly decrypts the GCM payload back to its original plain text", async () => {
    const plainText = "TheCakeIsALie";
    const payload = await encryptPassword(plainText, MOCK_ENV_KEY);

    const decrypted = await decryptPassword(payload, MOCK_ENV_KEY);
    expect(decrypted).toBe(plainText);
  });

  it("V3: Returns null dynamically if the payload is malformed or authentication tag fails", async () => {
    const invalidPayload = "malformed.payload.string";
    const decrypted = await decryptPassword(invalidPayload, MOCK_ENV_KEY);
    expect(decrypted).toBeNull();
  });
});
