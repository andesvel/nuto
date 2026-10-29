import * as React from "react";
import { LOCALE_TAGS, useLocale } from "@/app/i18n";

const subscribe = () => () => {};

/** False during SSR and hydration, true once the client has taken over. */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * A date in the app's language and the visitor's own time zone. The server
 * can't know the time zone, so the server render and hydration use UTC and
 * the local one replaces it right after. The element is keyed by its text,
 * so a page translator's copy of the old text is swapped out too.
 */
export function LocalDate({
  iso,
  options,
  className,
}: {
  iso: string;
  options: Intl.DateTimeFormatOptions;
  className?: string;
}) {
  const hydrated = useHydrated();
  const locale = useLocale();
  const text = new Date(iso).toLocaleDateString(
    LOCALE_TAGS[locale],
    hydrated ? options : { ...options, timeZone: "UTC" },
  );
  return (
    <time key={text} dateTime={iso} className={className}>
      {text}
    </time>
  );
}
