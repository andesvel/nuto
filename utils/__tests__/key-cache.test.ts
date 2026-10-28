import { describe, it, expect, vi } from "vitest";
import { cachedKey } from "../key-cache";

describe("cachedKey", () => {
  it("imports once per env key and evicts failures", async () => {
    const key = {} as CryptoKey;
    const factory = vi
      .fn<(envKey: string) => Promise<CryptoKey>>()
      .mockRejectedValueOnce(new Error("bad key"))
      .mockResolvedValue(key);
    const get = cachedKey(factory);

    await expect(get("k")).rejects.toThrow("bad key");
    expect(await get("k")).toBe(key);
    expect(await get("k")).toBe(key);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
