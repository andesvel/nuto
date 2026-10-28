/**
 * Caches derived CryptoKeys per isolate. Importing/deriving a key is pure
 * work on every call (the dashboard decrypted each link with a fresh
 * import), while the env key only changes on redeploy. Keys are
 * non-extractable, and a failed import is evicted so it can be retried.
 */
export function cachedKey(
  factory: (envKey: string) => Promise<CryptoKey>,
): (envKey: string) => Promise<CryptoKey> {
  const cache = new Map<string, Promise<CryptoKey>>();
  return (envKey) => {
    let key = cache.get(envKey);
    if (!key) {
      key = factory(envKey);
      cache.set(envKey, key);
      key.catch(() => cache.delete(envKey));
    }
    return key;
  };
}
