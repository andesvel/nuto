// Only alphanumeric slugs pass validation, so paths with "-", "/" or "."
// (sign-in, api/links, robots.txt...) can't collide and aren't listed.
export const RESERVED_SLUGS = new Set([
  "dashboard",
  "analytics",
  "login",
  "logout",
  "profile",
  "settings",
  "about",
  "help",
  "docs",
  "disclaimer",
  "terms",
  "privacy",
  "contact",
  "api",
  "admin",
  "redirect",
  "r",
  "webhooks",
  "assets",
  "static",
  "new",
  "create",
  "edit",
  "delete",
  "update",
  "list",
  "all",
  "home",
  "index",
  "queso",
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
