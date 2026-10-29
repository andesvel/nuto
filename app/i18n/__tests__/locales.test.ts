import { describe, it, expect } from "vitest";
import {
  isLocalizedPath,
  localizedPath,
  matchAcceptLanguage,
  readLocaleCookie,
  resolveLocale,
  splitLocalePath,
} from "../locales";
import { en } from "../messages/en";
import { es } from "../messages/es";

function request(path: string, headers: Record<string, string> = {}) {
  return new Request(`https://nuto.dev${path}`, { headers });
}

describe("locale paths", () => {
  it("splits the Spanish prefix and leaves English paths alone", () => {
    expect(splitLocalePath("/es")).toEqual({ locale: "es", path: "/" });
    expect(splitLocalePath("/es/privacy")).toEqual({
      locale: "es",
      path: "/privacy",
    });
    expect(splitLocalePath("/privacy")).toEqual({ locale: null, path: "/privacy" });
    // /en is not a prefix: English lives at the root
    expect(splitLocalePath("/en")).toEqual({ locale: null, path: "/en" });
  });

  it("builds the same page in another language", () => {
    expect(localizedPath("es", "/")).toBe("/es");
    expect(localizedPath("es", "/privacy")).toBe("/es/privacy");
    expect(localizedPath("en", "/es/privacy")).toBe("/privacy");
    expect(localizedPath("en", "/es")).toBe("/");
  });

  it("only treats the indexable pages as localized", () => {
    expect(isLocalizedPath("/")).toBe(true);
    expect(isLocalizedPath("/es/disclaimer")).toBe(true);
    expect(isLocalizedPath("/dashboard")).toBe(false);
    expect(isLocalizedPath("/p/abc")).toBe(false);
    expect(isLocalizedPath("/abc123")).toBe(false);
  });
});

describe("locale negotiation", () => {
  it("picks the best supported Accept-Language by q-value", () => {
    expect(matchAcceptLanguage("es-CO,es;q=0.9,en;q=0.8")).toBe("es");
    expect(matchAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.5,es;q=0.7")).toBe("es");
    expect(matchAcceptLanguage("de,fr")).toBeNull();
    expect(matchAcceptLanguage("es;q=0,en")).toBe("en");
    expect(matchAcceptLanguage(null)).toBeNull();
  });

  it("reads the language cookie and ignores unknown values", () => {
    expect(readLocaleCookie("a=1; nuto_lang=es")).toBe("es");
    expect(readLocaleCookie("nuto_lang=fr")).toBeNull();
  });

  it("follows the URL on localized pages", () => {
    const spanishBrowser = { "accept-language": "es-MX" };
    expect(resolveLocale(request("/", spanishBrowser))).toBe("en");
    expect(resolveLocale(request("/es/privacy"))).toBe("es");
  });

  it("follows the cookie, then the browser, on app pages", () => {
    expect(
      resolveLocale(
        request("/dashboard", { cookie: "nuto_lang=en", "accept-language": "es" }),
      ),
    ).toBe("en");
    expect(resolveLocale(request("/p/abc", { "accept-language": "es-AR" }))).toBe(
      "es",
    );
    expect(resolveLocale(request("/dashboard"))).toBe("en");
  });
});

// Types already force the same shape; this also catches empty strings and
// arrays of different length (FAQ items, steps).
describe("messages", () => {
  function shape(value: unknown): unknown {
    if (typeof value === "string") {
      expect(value.trim()).not.toBe("");
      return "string";
    }
    if (typeof value === "function") return `fn/${value.length}`;
    if (Array.isArray(value)) return value.map(shape);
    return Object.fromEntries(
      Object.entries(value as object).map(([k, v]) => [k, shape(v)]),
    );
  }

  it("has the same keys, arrays and function arities in every locale", () => {
    expect(shape(es)).toEqual(shape(en));
  });
});
