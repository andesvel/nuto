import * as React from "react";
import { useLocation, useRouteLoaderData } from "react-router";
import { X } from "lucide-react";
import {
  isLocale,
  isLocalizedPath,
  LOCALE_TAGS,
  messagesFor,
  useLocale,
} from "@/app/i18n";
import { Button } from "@ui/button";
import { rememberLocale, useSwitchLocale } from "./language-switcher";

/**
 * Offers the other language on localized pages when the visitor's browser
 * (or earlier choice) prefers it. Never redirects on its own: crawlers and
 * people who followed a link in one language get that language.
 */
export function LanguageBanner() {
  const locale = useLocale();
  const { pathname } = useLocation();
  const data = useRouteLoaderData("root") as
    | { preferredLocale?: unknown }
    | undefined;
  const preferred = isLocale(data?.preferredLocale)
    ? data.preferredLocale
    : null;
  const switchLocale = useSwitchLocale();
  const [dismissed, setDismissed] = React.useState(false);

  if (
    dismissed ||
    !preferred ||
    preferred === locale ||
    !isLocalizedPath(pathname)
  ) {
    return null;
  }

  // Written in the language it offers, so the visitor can read it
  const t = messagesFor(preferred);
  return (
    <div
      lang={LOCALE_TAGS[preferred]}
      role="region"
      aria-label={t.language.label}
      className="border-b bg-muted/60 text-sm"
    >
      <div className="c-root flex items-center justify-between gap-3 py-2">
        <p className="text-muted-foreground">{t.language.suggestion}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" onClick={() => switchLocale(preferred)}>
            {t.language.switchTo}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={t.language.dismiss}
            onClick={() => {
              // Staying on this language is a choice too
              rememberLocale(locale);
              setDismissed(true);
            }}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
