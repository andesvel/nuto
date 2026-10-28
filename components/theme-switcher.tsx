import * as React from "react";
import { useState, useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  applyTheme,
  readStoredTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/utils/theme";

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeSwitcher() {
  // The server can't know the stored theme; read it after hydration so the
  // first client render matches the SSR markup.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(readStoredTheme());

    // Another tab changed the theme
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY && e.key !== null) return;
      const next = readStoredTheme();
      setTheme(next);
      applyTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Follow OS changes while on "system"
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const choose = (value: string) => {
    const next = value as Theme;
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change theme"
          className="space-x-0"
        >
          <Sun
            size={20}
            strokeWidth={2}
            className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0"
          />
          <Moon
            size={20}
            strokeWidth={2}
            className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">Theme</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme ?? undefined} onValueChange={choose}>
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              className="flex items-center space-x-3"
            >
              <Icon size={20} strokeWidth={2} />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
