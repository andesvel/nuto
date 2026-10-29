import * as React from "react";
import { useLocation, useNavigate, useRevalidator } from "react-router";
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
 * Switches language: localized pages move to their URL in that language,
 * app pages reload their data in place (the root loader reads the cookie).
 */
export function useSwitchLocale(): (locale: Locale) => void {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  return (locale: Locale) => {
    rememberLocale(locale);
    if (isLocalizedPath(pathname)) {
      navigate(localizedPath(locale, pathname) + search + hash, {
        viewTransition: true,
      });
    } else {
      revalidator.revalidate();
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
