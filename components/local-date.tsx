import * as React from "react";

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
 * A date in the visitor's own time zone and locale. The server can't know
 * either, so the server render and hydration use a fixed en-US/UTC format
 * and the local one replaces it right after. The element is keyed by its
 * text, so a page translator's copy of the old text is swapped out too.
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
  const text = new Date(iso).toLocaleDateString(
    hydrated ? undefined : "en-US",
    hydrated ? options : { ...options, timeZone: "UTC" },
  );
  return (
    <time key={text} dateTime={iso} className={className}>
      {text}
    </time>
  );
}
