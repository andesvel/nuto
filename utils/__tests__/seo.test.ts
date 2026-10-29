import { describe, it, expect } from "vitest";
import { pageMeta } from "../seo";

const linkTags = (meta: ReturnType<typeof pageMeta>) =>
  meta.filter((m) => "tagName" in m && m.tagName === "link") as {
    rel: string;
    hrefLang?: string;
    href: string;
  }[];

describe("pageMeta", () => {
  const base = { title: "T", description: "D", imageAlt: "A" };

  it("points canonical at the page's own language and lists every alternate", () => {
    const meta = pageMeta({ ...base, locale: "es", path: "/privacy" });
    const links = linkTags(meta);
    expect(links.find((l) => l.rel === "canonical")?.href).toBe(
      "https://nuto.dev/es/privacy",
    );
    expect(
      Object.fromEntries(
        links.filter((l) => l.rel === "alternate").map((l) => [l.hrefLang, l.href]),
      ),
    ).toEqual({
      en: "https://nuto.dev/privacy",
      es: "https://nuto.dev/es/privacy",
      "x-default": "https://nuto.dev/privacy",
    });
  });

  it("sets og:locale, its alternate and the localized preview image", () => {
    const meta = pageMeta({ ...base, locale: "es", path: "/" });
    const prop = (name: string) =>
      meta
        .filter((m) => "property" in m && m.property === name)
        .map((m) => (m as { content: string }).content);
    expect(prop("og:locale")).toEqual(["es_419"]);
    expect(prop("og:locale:alternate")).toEqual(["en_US"]);
    expect(prop("og:url")).toEqual(["https://nuto.dev/es"]);
    expect(prop("og:image")).toEqual(["https://nuto.dev/og-es.png"]);
  });
});
