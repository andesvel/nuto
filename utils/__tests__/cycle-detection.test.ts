import { describe, it, expect } from "vitest";
import {
  extractSlugOnSameHost,
  createsCycle,
  type LongUrlLookup,
} from "../cycle-detection";

function lookupFrom(links: Record<string, string>): LongUrlLookup {
  return async (slug) => links[slug] ?? null;
}

describe("extractSlugOnSameHost", () => {
  it("extracts the first path segment of a same-host URL", () => {
    expect(extractSlugOnSameHost("http://localhost/abc", "localhost")).toBe(
      "abc",
    );
  });

  it("strips the port from the host header before comparing hosts", () => {
    expect(
      extractSlugOnSameHost("http://localhost:3000/abc", "localhost:3000"),
    ).toBe("abc");
    expect(
      extractSlugOnSameHost("http://localhost:3000/abc", "localhost"),
    ).toBe("abc");
  });

  it("prepends a scheme when the target URL has none", () => {
    expect(extractSlugOnSameHost("localhost/abc", "localhost")).toBe("abc");
  });

  it("ignores extra path segments and surrounding slashes", () => {
    expect(extractSlugOnSameHost("http://localhost/a/b/", "localhost")).toBe(
      "a",
    );
  });

  it("compares host and hostname case-insensitively", () => {
    expect(extractSlugOnSameHost("http://LocalHost/ABC", "LOCALHOST")).toBe(
      "ABC",
    );
  });

  it("returns null for a different host", () => {
    expect(extractSlugOnSameHost("https://other.com/abc", "localhost")).toBe(
      null,
    );
  });

  it("returns null for a root path on the same host", () => {
    expect(extractSlugOnSameHost("http://localhost/", "localhost")).toBe(null);
  });

  it("returns null when the host header is missing", () => {
    expect(extractSlugOnSameHost("http://localhost/abc", null)).toBe(null);
    expect(extractSlugOnSameHost("http://localhost/abc", "")).toBe(null);
  });

  it("returns null for an unparseable URL", () => {
    expect(extractSlugOnSameHost("http://", "localhost")).toBe(null);
  });
});

describe("createsCycle", () => {
  const host = "localhost";

  it("detects a cycle when the first target points back at the start slug", async () => {
    const lookup = lookupFrom({});
    const result = await createsCycle(
      "loop-a",
      `http://${host}/loop-a`,
      host,
      lookup,
    );
    expect(result).toBe(true);
  });

  it("detects a direct two-link cycle", async () => {
    const lookup = lookupFrom({ "loop-b": `http://${host}/loop-a` });
    const result = await createsCycle(
      "loop-a",
      `http://${host}/loop-b`,
      host,
      lookup,
    );
    expect(result).toBe(true);
  });

  it("follows the chain until it finds the cycle", async () => {
    const lookup = lookupFrom({
      "chain-1": `http://${host}/chain-2`,
      "chain-2": `http://${host}/chain-3`,
      "chain-3": `http://${host}/chain-1`,
    });
    const result = await createsCycle(
      "chain-1",
      `http://${host}/chain-2`,
      host,
      lookup,
    );
    expect(result).toBe(true);
  });

  it("returns false when the chain ends at an unknown slug", async () => {
    const lookup = lookupFrom({ "chain-1": `http://${host}/missing` });
    const result = await createsCycle(
      "start",
      `http://${host}/chain-1`,
      host,
      lookup,
    );
    expect(result).toBe(false);
  });

  it("returns false when the first target is on another host", async () => {
    const lookup = lookupFrom({ "chain-1": `http://${host}/chain-2` });
    const result = await createsCycle(
      "start",
      "https://elsewhere.com/chain-1",
      host,
      lookup,
    );
    expect(result).toBe(false);
  });

  it("stops walking once the chain leaves the origin host", async () => {
    const lookup = lookupFrom({
      "chain-1": "https://elsewhere.com/chain-2",
    });
    const result = await createsCycle(
      "start",
      `http://${host}/chain-1`,
      host,
      lookup,
    );
    expect(result).toBe(false);
  });

  it("stops after maxDepth hops even without a repeat", async () => {
    const lookup = lookupFrom({
      "hop-1": `http://${host}/hop-2`,
      "hop-2": `http://${host}/hop-3`,
      "hop-3": `http://${host}/hop-4`,
      "hop-4": `http://${host}/hop-5`,
    });
    const result = await createsCycle(
      "start",
      `http://${host}/hop-1`,
      host,
      lookup,
      3,
    );
    expect(result).toBe(false);
  });

  it("detects cycles across short codes with ports in the host header", async () => {
    const lookup = lookupFrom({ "loop-b": "http://localhost:3000/loop-a" });
    const result = await createsCycle(
      "loop-a",
      "http://localhost:3000/loop-b",
      "localhost:3000",
      lookup,
    );
    expect(result).toBe(true);
  });

  it("calls the lookup with each visited slug", async () => {
    const seen: string[] = [];
    const lookup: LongUrlLookup = async (slug) => {
      seen.push(slug);
      return `http://${host}/next-${seen.length}`;
    };
    const result = await createsCycle(
      "start",
      `http://${host}/first`,
      host,
      lookup,
      2,
    );
    expect(result).toBe(false);
    expect(seen).toEqual(["first", "next-1"]);
  });
});
