import { toAbsoluteUrl } from "./url";

export function isSelfReferential(
  longUrl: string,
  shortCode: string,
  hostHeader: string | null
): boolean {
  try {
    const url = new URL(toAbsoluteUrl(longUrl));

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
