import * as React from "react";
import { useRouteLoaderData } from "react-router";
import { DEFAULT_LOCALE, isLocale, LOCALE_TAGS, type Locale } from "./locales";
import { en, type Messages } from "./messages/en";
import { es } from "./messages/es";

export type { Messages, ErrorCode } from "./messages/en";
export * from "./locales";

const MESSAGES: Record<Locale, Messages> = { en, es };

export function messagesFor(locale: Locale): Messages {
  return MESSAGES[locale];
}

/**
 * The current locale, read from the root loader (which resolves it from the
 * URL or the visitor's preference). Falls back to the default where the
 * root data isn't available, e.g. while the root itself is erroring.
 */
export function useLocale(): Locale {
  const data = useRouteLoaderData("root") as { locale?: unknown } | undefined;
  return isLocale(data?.locale) ? data.locale : DEFAULT_LOCALE;
}

export function useT(): Messages {
  return messagesFor(useLocale());
}

/** Locale-aware number formatting (1,234 vs 1.234). */
export function useFormatNumber(): (n: number) => string {
  const locale = useLocale();
  return React.useCallback(
    (n: number) => n.toLocaleString(LOCALE_TAGS[locale]),
    [locale],
  );
}

/** The root loader's locale from inside a meta function. */
export function localeFromMatches(
  matches: ReadonlyArray<{ id: string; data?: unknown } | undefined>,
): Locale {
  const root = matches.find((m) => m?.id === "root")?.data as
    | { locale?: unknown }
    | undefined;
  return isLocale(root?.locale) ? root.locale : DEFAULT_LOCALE;
}
