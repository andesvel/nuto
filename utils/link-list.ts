export type SortKey =
  | "lastClicked"
  | "createdAt"
  | "clicks"
  | "expiresAt"
  | "shortCode";
export type SortOrder = "asc" | "desc";
export type SortValue = { key: SortKey; order: SortOrder };

export interface SortOption {
  // The direction people usually want for this field
  defaultOrder: SortOrder;
}

// Menu order is the declaration order. Labels live in the i18n messages
// (sort.keys), one per field and direction.
export const SORT_OPTIONS: Record<SortKey, SortOption> = {
  lastClicked: { defaultOrder: "desc" },
  createdAt: { defaultOrder: "desc" },
  clicks: { defaultOrder: "desc" },
  expiresAt: { defaultOrder: "asc" },
  shortCode: { defaultOrder: "asc" },
};

export const DEFAULT_SORT: SortValue = { key: "lastClicked", order: "desc" };

export function isSortValue(value: unknown): value is SortValue {
  if (!value || typeof value !== "object") return false;
  const { key, order } = value as Record<string, unknown>;
  return (
    typeof key === "string" &&
    key in SORT_OPTIONS &&
    (order === "asc" || order === "desc")
  );
}

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

function time(value: string | null | undefined): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

// Unlike `a - b`, never returns NaN, which would make Array#sort's order
// undefined.
function compareNumbers(a: number, b: number): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function byCode<T extends ListedLink>(a: T, b: T): number {
  return a.shortCode.localeCompare(b.shortCode, undefined, {
    sensitivity: "base",
  });
}

/**
 * Sorts by the chosen field and direction. Links without a value for the
 * field (e.g. no expiration) always go last, whichever the direction, and
 * ties fall back to the short code so the order is stable.
 */
export function sortLinks<T extends ListedLink>(
  links: T[],
  sort: SortValue,
): T[] {
  const dir = sort.order === "asc" ? 1 : -1;
  const value = (l: T): number | null => {
    switch (sort.key) {
      case "clicks":
        return l.clicks || 0;
      case "createdAt":
        return time(l.createdAt);
      case "expiresAt":
        return time(l.expiresAt);
      case "lastClicked":
        // Same as the loader's COALESCE(last_clicked, created_at)
        return time(l.lastClicked) ?? time(l.createdAt);
      case "shortCode":
        return null; // compared as text below
    }
  };

  return [...links].sort((a, b) => {
    if (sort.key === "shortCode") return dir * byCode(a, b);

    const va = value(a);
    const vb = value(b);
    if (va === null || vb === null) {
      if (va !== vb) return va === null ? 1 : -1;
      return byCode(a, b);
    }
    return dir * compareNumbers(va, vb) || byCode(a, b);
  });
}
