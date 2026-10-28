// Signed access cookie for password-protected links.
//
// Cookie: pw_<slug>=<exp>.<sig>, where sig = HMAC-SHA256(slug.fingerprint.exp)
// with a key derived (HKDF) from PASSCODE_ENC_KEY. The fingerprint is derived
// from the stored password hash, so changing the password invalidates every
// cookie issued for the old one. Expiry is enforced server-side.

export const ACCESS_COOKIE_MAX_AGE = 60 * 60; // 1 hour

const encoder = new TextEncoder();

const b64url = {
  encode: (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
  decode: (str: string) => {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  },
};

async function signingKey(envKey: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(envKey), (c) => c.charCodeAt(0));
  const base = await crypto.subtle.importKey("raw", raw, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(),
      info: encoder.encode("nuto:link-access-cookie"),
    },
    base,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Short, non-reversible identifier of the current password hash. */
export async function passwordFingerprint(storedHash: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(storedHash),
  );
  return b64url.encode(digest).slice(0, 22);
}

export function accessCookieName(slug: string): string {
  return `pw_${slug}`;
}

function payload(slug: string, fingerprint: string, exp: number) {
  return encoder.encode(`${slug}.${fingerprint}.${exp}`);
}

export async function createAccessCookie(
  slug: string,
  fingerprint: string,
  envKey: string,
  { secure, now = Date.now() }: { secure: boolean; now?: number },
): Promise<string> {
  const exp = Math.floor(now / 1000) + ACCESS_COOKIE_MAX_AGE;
  const key = await signingKey(envKey);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    payload(slug, fingerprint, exp),
  );
  const value = `${exp}.${b64url.encode(sig)}`;
  const secureAttr = secure ? "; Secure" : "";
  return `${accessCookieName(slug)}=${value}; Path=/${slug}; HttpOnly; Max-Age=${ACCESS_COOKIE_MAX_AGE}; SameSite=Lax${secureAttr}`;
}

/** All values for a cookie name (several can coexist with different paths). */
export function readCookieValues(
  cookieHeader: string | null,
  name: string,
): string[] {
  if (!cookieHeader) return [];
  const values: string[] = [];
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) values.push(part.slice(eq + 1).trim());
  }
  return values;
}

async function verifyAccessValue(
  value: string,
  slug: string,
  fingerprint: string,
  key: CryptoKey,
  now: number,
): Promise<boolean> {
  const [expRaw, sigRaw] = value.split(".");
  const exp = Number(expRaw);
  if (!sigRaw || !Number.isInteger(exp) || exp * 1000 <= now) return false;
  try {
    // crypto.subtle.verify compares in constant time
    return await crypto.subtle.verify(
      "HMAC",
      key,
      b64url.decode(sigRaw),
      payload(slug, fingerprint, exp),
    );
  } catch {
    return false;
  }
}

export async function hasValidAccessCookie(
  cookieHeader: string | null,
  slug: string,
  fingerprint: string,
  envKey: string,
  now: number = Date.now(),
): Promise<boolean> {
  const values = readCookieValues(cookieHeader, accessCookieName(slug));
  if (values.length === 0) return false;

  const key = await signingKey(envKey);
  for (const value of values) {
    if (await verifyAccessValue(value, slug, fingerprint, key, now)) return true;
  }
  return false;
}
