import type { MetaDescriptor } from "react-router";

export const SITE_URL = "https://nuto.dev";
export const SITE_NAME = "Nuto";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`;

/**
 * Meta tags for an indexable page: title, description, canonical URL and the
 * Open Graph / Twitter card set. Canonical URLs always point at the
 * production origin so previews and alternate hosts don't compete with it.
 */
export function pageMeta({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt = "Nuto: short links that open in native apps",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): MetaDescriptor[] {
  const url = new URL(path, SITE_URL).href;
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:url", content: url },
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
