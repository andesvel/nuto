// Link password hashing.
//
// New hashes: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>.
// Legacy hashes (unsalted SHA-256 hex) still verify, and verifyLinkPassword
// flags them so the caller can re-hash on the next successful unlock.

// Workers caps PBKDF2 at 100k iterations.
export const PBKDF2_ITERATIONS = 100_000;
const PREFIX = "pbkdf2-sha256";
const SALT_BYTES = 16;
const HASH_BITS = 256;

const encoder = new TextEncoder();

const b64 = {
  encode: (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)),
  decode: (str: string) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
};

async function pbkdf2(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

async function legacySha256Hex(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashLinkPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${PREFIX}$${PBKDF2_ITERATIONS}$${b64.encode(salt)}$${b64.encode(hash)}`;
}

export async function verifyLinkPassword(
  password: string,
  stored: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (stored.startsWith(`${PREFIX}$`)) {
    const [, iterRaw, saltRaw, hashRaw] = stored.split("$");
    const iterations = Number(iterRaw);
    if (!Number.isInteger(iterations) || !saltRaw || !hashRaw) {
      return { valid: false, needsRehash: false };
    }
    try {
      const expected = b64.decode(hashRaw);
      const actual = await pbkdf2(password, b64.decode(saltRaw), iterations);
      const valid = timingSafeEqual(actual, expected);
      return { valid, needsRehash: valid && iterations < PBKDF2_ITERATIONS };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy unsalted SHA-256
  const actual = await legacySha256Hex(password);
  const valid = timingSafeEqual(encoder.encode(actual), encoder.encode(stored));
  return { valid, needsRehash: valid };
}
