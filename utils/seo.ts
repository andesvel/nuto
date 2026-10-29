import type { MetaDescriptor } from "react-router";
import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  LOCALES,
  localizedPath,
  OG_LOCALES,
  type Locale,
} from "@/app/i18n/locales";

export const SITE_URL = "https://nuto.dev";
export const SITE_NAME = "Nuto";

/** Social preview image for a locale (the artwork carries text). */
export function ogImage(locale: Locale): string {
  return `${SITE_URL}/${locale === DEFAULT_LOCALE ? "og" : `og-${locale}`}.png`;
}

/**
 * Meta tags for an indexable page in one language: title, description,
 * canonical URL, hreflang alternates for every language (x-default is
 * English), and the Open Graph / Twitter card set. URLs always point at the
 * production origin so previews and alternate hosts don't compete with it.
 *
 * `path` is the page's unprefixed path ("/privacy"); each language's URL is
 * derived from it.
 */
export function pageMeta({
  locale,
  path,
  title,
  description,
  imageAlt,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  imageAlt: string;
}): MetaDescriptor[] {
  const urlFor = (l: Locale) => new URL(localizedPath(l, path), SITE_URL).href;
  const url = urlFor(locale);
  const image = ogImage(locale);
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    ...LOCALES.map((l) => ({
      tagName: "link",
      rel: "alternate",
      hrefLang: LOCALE_TAGS[l],
      href: urlFor(l),
    })),
    {
      tagName: "link",
      rel: "alternate",
      hrefLang: "x-default",
      href: urlFor(DEFAULT_LOCALE),
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:url", content: url },
    { property: "og:locale", content: OG_LOCALES[locale] },
    ...LOCALES.filter((l) => l !== locale).map((l) => ({
      property: "og:locale:alternate",
      content: OG_LOCALES[l],
    })),
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];
}

/** Meta tags for a page that should stay out of search results. */
export function privateMeta(title: string): MetaDescriptor[] {
  return [{ title }, { name: "robots", content: "noindex, nofollow" }];
}
