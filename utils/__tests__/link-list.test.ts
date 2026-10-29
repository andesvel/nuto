import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  filterLinks,
  isSortValue,
  sortLinks,
  SORT_OPTIONS,
  type ListedLink,
  type SortKey,
} from "../link-list";
import { LOCALES, messagesFor } from "@/app/i18n";

function link(overrides: Partial<ListedLink> & { shortCode: string }): ListedLink {
  return {
    longUrl: "https://example.com",
    createdAt: "2026-01-01 00:00:00",
    expiresAt: null,
    clicks: 0,
    lastClicked: null,
    ...overrides,
  };
}

const links = [
  link({ shortCode: "Alpha", longUrl: "https://YouTube.com/watch?v=1", clicks: 5, createdAt: "2026-01-03 00:00:00" }),
  link({ shortCode: "beta", longUrl: "https://spotify.com/x", expiresAt: "2026-02-01T00:00:00.000Z", createdAt: "2026-01-01 00:00:00" }),
  link({ shortCode: "gamma", longUrl: "https://example.org", expiresAt: "2026-01-15T00:00:00.000Z", clicks: 2, createdAt: "2026-01-02 00:00:00" }),
];

const codes = (list: ListedLink[]) => list.map((l) => l.shortCode);

describe("filterLinks", () => {
  const index = buildSearchIndex(links);

  it("matches code, URL and host case-insensitively", () => {
    expect(codes(filterLinks(index, "ALPHA"))).toEqual(["Alpha"]);
    expect(codes(filterLinks(index, "youtube"))).toEqual(["Alpha"]);
    expect(codes(filterLinks(index, " .org "))).toEqual(["gamma"]);
  });

  it("returns every link for an empty query", () => {
    expect(filterLinks(index, "  ")).toHaveLength(3);
  });
});

describe("sortLinks", () => {
  it("keeps links without an expiration last in both directions", () => {
    expect(codes(sortLinks(links, { key: "expiresAt", order: "asc" }))).toEqual([
      "gamma",
      "beta",
      "Alpha",
    ]);
    expect(codes(sortLinks(links, { key: "expiresAt", order: "desc" }))).toEqual([
      "beta",
      "gamma",
      "Alpha",
    ]);
  });

  it("sorts by creation date", () => {
    expect(codes(sortLinks(links, { key: "createdAt", order: "desc" }))).toEqual([
      "Alpha",
      "gamma",
      "beta",
    ]);
  });

  it("sorts by clicks and breaks ties by short code", () => {
    const tied = [...links, link({ shortCode: "aaa", clicks: 2 })];
    expect(codes(sortLinks(tied, { key: "clicks", order: "desc" }))).toEqual([
      "Alpha",
      "aaa",
      "gamma",
      "beta",
    ]);
  });

  it("sorts by short code without case sensitivity", () => {
    expect(codes(sortLinks(links, { key: "shortCode", order: "desc" }))).toEqual([
      "gamma",
      "beta",
      "Alpha",
    ]);
  });

  it("falls back to createdAt for links never clicked", () => {
    const list = [
      link({ shortCode: "old", createdAt: "2026-01-01 00:00:00" }),
      link({ shortCode: "clicked", createdAt: "2025-01-01 00:00:00", lastClicked: "2026-03-01 00:00:00" }),
    ];
    expect(codes(sortLinks(list, { key: "lastClicked", order: "desc" }))).toEqual([
      "clicked",
      "old",
    ]);
  });

  it("doesn't mutate the input", () => {
    const copy = [...links];
    sortLinks(links, { key: "clicks", order: "asc" });
    expect(links).toEqual(copy);
  });
});

describe("sort options", () => {
  it("cover every key with labels for both directions in every locale", () => {
    for (const locale of LOCALES) {
      const keys = messagesFor(locale).sort.keys;
      for (const key of Object.keys(SORT_OPTIONS) as SortKey[]) {
        expect(keys[key].label).toBeTruthy();
        expect(keys[key].orders.asc).toBeTruthy();
        expect(keys[key].orders.desc).toBeTruthy();
      }
    }
  });

  it("isSortValue rejects unknown keys (like the old createdAt mix-up) and orders", () => {
    expect(isSortValue({ key: "clicks", order: "desc" })).toBe(true);
    expect(isSortValue({ key: "dueDate", order: "desc" })).toBe(false);
    expect(isSortValue({ key: "clicks", order: "up" })).toBe(false);
    expect(isSortValue(null)).toBe(false);
  });
});
