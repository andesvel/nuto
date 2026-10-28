export interface RedirectCacheEntry {
  longUrl: string;
  hasPassword: boolean;
  // Identifies the current password (see utils/link-access); never the hash
  passwordFingerprint?: string | null;
  expiresAt?: string | null;
}

// Bump when the entry shape changes; older entries are read as a miss and
// repopulated from D1.
const CACHE_VERSION = 2;

export interface RedirectCacheWriteOptions {
  expiration?: number;
  expirationTtl?: number;
}

// Default lifetime for cache entries; a KV miss repopulates from D1.
export const REDIRECT_CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

// KV rejects absolute expirations less than 60 seconds in the future.
const KV_MIN_EXPIRATION_SECONDS = 60;

/**
 * KV write options for a link: the entry never outlives the link's own
 * expiration, and never lives longer than REDIRECT_CACHE_TTL.
 */
export function redirectCacheOptions(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): RedirectCacheWriteOptions {
  const nowSeconds = Math.floor(now / 1000);
  const maxExpiration = nowSeconds + REDIRECT_CACHE_TTL;

  if (!expiresAt) return { expirationTtl: REDIRECT_CACHE_TTL };

  const expiresSeconds = Math.floor(new Date(expiresAt).getTime() / 1000);
  if (Number.isNaN(expiresSeconds)) {
    return { expirationTtl: REDIRECT_CACHE_TTL };
  }

  // Links expiring within the KV minimum still get the floor; the redirect
  // loader checks expiresAt on every hit, so they are never served late.
  const expiration = Math.min(
    Math.max(expiresSeconds, nowSeconds + KV_MIN_EXPIRATION_SECONDS),
    maxExpiration,
  );
  return { expiration };
}

export function isExpired(
  expiresAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!expiresAt) return false;
  const time = new Date(expiresAt).getTime();
  return !Number.isNaN(time) && time <= now;
}

/**
 * Reads a cached redirect. Entries from older cache versions (raw strings,
 * entries without expiresAt, or carrying the raw password hash) are treated
 * as a miss, so the caller repopulates them from D1.
 */
export async function getRedirectEntry(
  kv: KVNamespace,
  slug: string,
): Promise<RedirectCacheEntry | null> {
  const raw = await kv.get(slug);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.v === CACHE_VERSION &&
      typeof parsed.longUrl === "string"
    ) {
      const hasPassword = !!parsed.hasPassword;
      const passwordFingerprint = parsed.passwordFingerprint || null;
      // A protected entry without its fingerprint can't be verified
      if (hasPassword && !passwordFingerprint) return null;
      return {
        longUrl: parsed.longUrl,
        hasPassword,
        passwordFingerprint,
        expiresAt: parsed.expiresAt || null,
      };
    }
  } catch {
    // legacy non-JSON value
  }
  return null;
}

export async function putRedirectEntry(
  kv: KVNamespace,
  slug: string,
  entry: RedirectCacheEntry,
): Promise<void> {
  const value = {
    v: CACHE_VERSION,
    longUrl: entry.longUrl,
    hasPassword: entry.hasPassword,
    passwordFingerprint: entry.passwordFingerprint ?? null,
    expiresAt: entry.expiresAt ?? null,
  };
  await kv.put(slug, JSON.stringify(value), redirectCacheOptions(entry.expiresAt));
}

export async function deleteRedirectEntry(
  kv: KVNamespace,
  slug: string,
): Promise<void> {
  await kv.delete(slug);
}

export async function deleteRedirectEntries(
  kv: KVNamespace,
  slugs: string[],
): Promise<void> {
  await Promise.all(slugs.map((slug) => kv.delete(slug)));
}
