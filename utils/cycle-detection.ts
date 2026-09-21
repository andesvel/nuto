export function extractSlugOnSameHost(
  targetUrl: string,
  hostHeader: string | null,
): string | null {
  try {
    const url = new URL(
      targetUrl.startsWith("http") ? targetUrl : `http://${targetUrl}`,
    );
    const reqHost = (hostHeader || "").toLowerCase().split(":")[0];
    if (!reqHost || url.hostname.toLowerCase() !== reqHost) return null;
    const path = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    const slug = path.split("/")[0] || "";
    return slug || null;
  } catch {
    return null;
  }
}

export type LongUrlLookup = (slug: string) => Promise<string | null>;

export async function createsCycle(
  startSlug: string,
  firstTargetUrl: string,
  hostHeader: string | null,
  getLongUrlBySlug: LongUrlLookup,
  maxDepth = 5,
): Promise<boolean> {
  const visited = new Set<string>([startSlug]);
  let depth = 0;
  let nextSlug = extractSlugOnSameHost(firstTargetUrl, hostHeader);

  while (nextSlug && depth < maxDepth) {
    if (visited.has(nextSlug)) return true;

    visited.add(nextSlug);

    const nextLong = await getLongUrlBySlug(nextSlug);
    if (!nextLong) return false;

    nextSlug = extractSlugOnSameHost(nextLong, hostHeader);
    depth++;
  }

  return false;
}
