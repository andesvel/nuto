export const RESERVED_SLUGS = new Set([
  "dashboard",
  "sign-in",
  "sign-up",
  "login",
  "logout",
  "profile",
  "settings",
  "about",
  "help",
  "docs",
  "api",
  "admin",
  "api/links",
  "api/users",
  "api/stats",
  "api/webhooks",
  "redirect",
  "r",
  "webhooks",
  "assets",
  "static",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function validateShortCode(input: string | null | undefined): {
  isReserved: boolean;
  hasValidChars: boolean;
  isValid: boolean;
} {
  const slug = input?.trim().toLowerCase() ?? "";
  const hasValidChars = /^[0-9a-zA-Z]+$/.test(slug);
  const isReserved = RESERVED_SLUGS.has(slug);

  return {
    isReserved,
    hasValidChars,
    isValid: hasValidChars && !isReserved,
  };
}
