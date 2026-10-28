/**
 * Stored long URLs are normalized on write since the input validation
 * landed, but older rows may lack a scheme. Reads go through this so every
 * caller treats them the same way.
 */
export function toAbsoluteUrl(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
}
