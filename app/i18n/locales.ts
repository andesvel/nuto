export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** The visitor's explicit language choice (switcher or banner). */
export const LOCALE_COOKIE = "nuto_lang";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/** BCP 47 tag for <html lang>, hreflang and Intl. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en",
  es: "es",
};

export const OG_LOCALES: Record<Locale, string> = {
  en: "en_US",
  es: "es_419",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

/**
 * Pages whose language comes from the URL (indexable content): English at
 * the root, every other locale under its own prefix (/es, /es/privacy).
 * The app itself (dashboard, sign-in, password wall) keeps one URL and
 * follows the visitor's preference instead.
 */
export const LOCALIZED_PATHS = ["/", "/privacy", "/disclaimer"] as const;

/** "/es/privacy" → { locale: "es", path: "/privacy" } */
export function splitLocalePath(pathname: string): {
  locale: Locale | null;
  path: string;
} {
  const match = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (match && isLocale(match[1]) && match[1] !== DEFAULT_LOCALE) {
    return { locale: match[1], path: match[2] || "/" };
  }
  return { locale: null, path: pathname };
}

export function isLocalizedPath(pathname: string): boolean {
  const { path } = splitLocalePath(pathname);
  return (LOCALIZED_PATHS as readonly string[]).includes(
    path.replace(/\/$/, "") || "/",
  );
}

/** The same localized page in another language: ("es", "/privacy") → "/es/privacy" */
export function localizedPath(locale: Locale, path: string): string {
  const { path: bare } = splitLocalePath(path);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === "/" ? `/${locale}` : `/${locale}${bare}`;
}

/** Best supported match for an Accept-Language header, honoring q-values. */
export function matchAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter(({ tag, q }) => tag && q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}

export function readLocaleCookie(cookieHeader: string | null): Locale | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, value] = part.trim().split("=");
    if (name === LOCALE_COOKIE && isLocale(value)) return value;
  }
  return null;
}

/** Explicit choice first, then the browser's languages. */
export function preferredLocale(request: Request): Locale | null {
  return (
    readLocaleCookie(request.headers.get("cookie")) ??
    matchAcceptLanguage(request.headers.get("accept-language"))
  );
}

/**
 * The language a request renders in: localized pages follow their URL,
 * everything else the visitor's preference.
 */
export function resolveLocale(request: Request): Locale {
  const { pathname } = new URL(request.url);
  if (isLocalizedPath(pathname)) {
    return splitLocalePath(pathname).locale ?? DEFAULT_LOCALE;
  }
  return preferredLocale(request) ?? DEFAULT_LOCALE;
}
