import { describe, it, expect } from "vitest";
import {
  buildSearchIndex,
  filterLinks,
  sortLinks,
  type ListedLink,
} from "../link-list";

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
  link({ shortCode: "Alpha", longUrl: "https://YouTube.com/watch?v=1", clicks: 5 }),
  link({ shortCode: "beta", longUrl: "https://spotify.com/x", expiresAt: "2026-02-01T00:00:00.000Z" }),
  link({ shortCode: "gamma", longUrl: "https://example.org", expiresAt: "2026-01-15T00:00:00.000Z", clicks: 2 }),
];

describe("filterLinks", () => {
  const index = buildSearchIndex(links);

  it("matches code, URL and host case-insensitively", () => {
    expect(filterLinks(index, "ALPHA").map((l) => l.shortCode)).toEqual(["Alpha"]);
    expect(filterLinks(index, "youtube").map((l) => l.shortCode)).toEqual(["Alpha"]);
    expect(filterLinks(index, " .org ").map((l) => l.shortCode)).toEqual(["gamma"]);
  });

  it("returns every link for an empty query", () => {
    expect(filterLinks(index, "  ")).toHaveLength(3);
  });
});

describe("sortLinks", () => {
  it("sorts by expiration with never-expiring links last (no NaN comparisons)", () => {
    const asc = sortLinks(links, { key: "expiresAt", order: "asc" });
    expect(asc.map((l) => l.shortCode)).toEqual(["gamma", "beta", "Alpha"]);
    const desc = sortLinks(links, { key: "expiresAt", order: "desc" });
    expect(desc.map((l) => l.shortCode)).toEqual(["Alpha", "beta", "gamma"]);
  });

  it("sorts by clicks and by code", () => {
    expect(
      sortLinks(links, { key: "clicks", order: "desc" }).map((l) => l.shortCode),
    ).toEqual(["Alpha", "gamma", "beta"]);
    expect(
      sortLinks(links, { key: "shortCode", order: "asc" }).map((l) => l.shortCode),
    ).toEqual(["Alpha", "beta", "gamma"]);
  });

  it("falls back to createdAt for links never clicked", () => {
    const list = [
      link({ shortCode: "old", createdAt: "2026-01-01 00:00:00" }),
      link({ shortCode: "clicked", createdAt: "2025-01-01 00:00:00", lastClicked: "2026-03-01 00:00:00" }),
    ];
    expect(
      sortLinks(list, { key: "lastClicked", order: "desc" }).map((l) => l.shortCode),
    ).toEqual(["clicked", "old"]);
  });

  it("doesn't mutate the input", () => {
    const copy = [...links];
    sortLinks(links, { key: "clicks", order: "asc" });
    expect(links).toEqual(copy);
  });
});
