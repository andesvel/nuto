const b64 = {
  encode: (buf: ArrayBuffer | Uint8Array) => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return btoa(String.fromCharCode(...bytes));
  },
  decode: (str: string) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
};

async function importKey(envKey: string) {
  const raw = b64.decode(envKey); // 32 bytes
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptPassword(plain: string, envKey: string) {
  const key = await importKey(envKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(plain);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc);
  return b64.encode(iv) + "." + b64.encode(ct);
}

export async function decryptPassword(payload: string, envKey: string) {
  try {
    const [ivB64, ctB64] = payload.split(".");
    if (!ivB64 || !ctB64) return null;
    const key = await importKey(envKey);
    const iv = b64.decode(ivB64);
    const ct = b64.decode(ctB64);
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    return null;
  }
}
