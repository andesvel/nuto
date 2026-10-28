import type { SortValue } from "@/components/links/sort-links";

export interface ListedLink {
  shortCode: string;
  longUrl: string;
  createdAt: string;
  expiresAt: string | null;
  clicks: number;
  lastClicked: string | null;
}

export interface SearchEntry<T> {
  link: T;
  text: string;
}

/**
 * Lowercased searchable text per link, built once per list instead of per
 * keystroke. The long URL already contains the hostname, so searching by
 * host needs no URL parsing.
 */
export function buildSearchIndex<T extends ListedLink>(
  links: T[],
): SearchEntry<T>[] {
  return links.map((link) => ({
    link,
    text: `${link.shortCode}\n${link.longUrl}`.toLowerCase(),
  }));
}

export function filterLinks<T extends ListedLink>(
  index: SearchEntry<T>[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return index.map((entry) => entry.link);
  return index.filter((entry) => entry.text.includes(q)).map((e) => e.link);
}

// Missing dates sort last in ascending order (e.g. links that never expire).
function time(value: string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

// Unlike `a - b`, never returns NaN (Infinity - Infinity), which would make
// Array#sort's order undefined.
function compareNumbers(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

export function sortLinks<T extends ListedLink>(
  links: T[],
  sort: SortValue,
): T[] {
  const dir = sort.order === "asc" ? 1 : -1;
  const lastActivity = (l: T) =>
    l.lastClicked ? time(l.lastClicked) : time(l.createdAt);

  return [...links].sort((a, b) => {
    switch (sort.key) {
      case "shortCode":
        return (
          dir *
          a.shortCode.localeCompare(b.shortCode, undefined, {
            sensitivity: "base",
          })
        );
      case "clicks":
        return dir * compareNumbers(a.clicks || 0, b.clicks || 0);
      case "expiresAt":
        return dir * compareNumbers(time(a.expiresAt), time(b.expiresAt));
      case "lastClicked":
        // Same as the loader's COALESCE(last_clicked, created_at)
        return dir * compareNumbers(lastActivity(a), lastActivity(b));
    }
  });
}
