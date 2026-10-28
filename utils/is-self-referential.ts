export function isSelfReferential(
  longUrl: string,
  shortCode: string,
  hostHeader: string | null
): boolean {
  try {
    const normalized = longUrl.startsWith("http")
      ? longUrl
      : `http://${longUrl}`;
    const url = new URL(normalized);

    // Normalizes hostnames to compare
    const reqHost = (hostHeader || "").toLowerCase().split(":")[0];
    const targetHost = url.hostname.toLowerCase();

    if (!reqHost || targetHost !== reqHost) return false;

    // Normalize paths to compare
    const path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    return path === shortCode;
  } catch {
    return false;
  }
}
