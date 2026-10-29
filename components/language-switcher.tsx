import * as React from "react";
import { useLocation } from "react-router";
import { Languages } from "lucide-react";
import {
  isLocalizedPath,
  LOCALE_COOKIE,
  LOCALE_NAMES,
  LOCALES,
  localizedPath,
  useLocale,
  useT,
  type Locale,
} from "@/app/i18n";
import { Button } from "@ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";

export function rememberLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Switches language with a full page load: localized pages go to their URL
 * in that language, app pages reload in place (the root loader reads the
 * cookie). A client-side switch left Clerk's sign-in in the old language,
 * and re-applying Clerk's localization at runtime stopped its modal from
 * opening, so the document is rebuilt instead. Switching is rare.
 */
export function useSwitchLocale(): (locale: Locale) => void {
  const { pathname, search, hash } = useLocation();
  return (locale: Locale) => {
    rememberLocale(locale);
    if (isLocalizedPath(pathname)) {
      window.location.assign(localizedPath(locale, pathname) + search + hash);
    } else {
      window.location.reload();
    }
  };
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useT();
  const switchLocale = useSwitchLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t.language.label}>
          <Languages size={20} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">{t.language.label}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => switchLocale(value as Locale)}
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem key={l} value={l} lang={l}>
              <span translate="no">{LOCALE_NAMES[l]}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
