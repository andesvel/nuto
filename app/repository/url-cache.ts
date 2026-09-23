export interface RedirectCacheEntry {
  longUrl: string;
  hasPassword: boolean;
  storedHash?: string | null;
}

export interface RedirectCacheWriteOptions {
  expiration?: number;
  expirationTtl?: number;
}

export async function getRedirectEntry(
  kv: KVNamespace,
  slug: string,
): Promise<RedirectCacheEntry | null> {
  const raw = await kv.get(slug);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "longUrl" in parsed) {
      return {
        longUrl: parsed.longUrl,
        hasPassword: !!parsed.hasPassword,
        storedHash: parsed.storedHash || null,
      };
    }
  } catch {
    // fall through and treat the raw value as the long URL
  }
  return { longUrl: raw, hasPassword: false, storedHash: null };
}

export async function putRedirectEntry(
  kv: KVNamespace,
  slug: string,
  entry: RedirectCacheEntry,
  options?: RedirectCacheWriteOptions,
): Promise<void> {
  await kv.put(slug, JSON.stringify(entry), options);
}

export async function deleteRedirectEntry(
  kv: KVNamespace,
  slug: string,
): Promise<void> {
  await kv.delete(slug);
}
