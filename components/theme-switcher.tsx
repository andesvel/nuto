"use client";

import {useState, useEffect} from "react"
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system"; // Default for SSR, will be updated on client
    }
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (themeToApply: Theme) => {
      if (themeToApply === "light") {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else if (themeToApply === "dark") {
        root.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        // system
        localStorage.removeItem("theme");
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme(currentTheme);

    const systemThemeListener = (e: MediaQueryListEvent) => {
      // Only apply if current theme is 'system'
      if (currentTheme === "system") {
        if (e.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    // Add listener only if the theme is 'system' to avoid unnecessary updates
    if (currentTheme === "system") {
      mediaQuery.addEventListener("change", systemThemeListener);
    }

    return () => {
      mediaQuery.removeEventListener("change", systemThemeListener);
    };
  }, [currentTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change theme"
          name="Change theme"
        >
          <Sun
            size={20}
            strokeWidth={1.5}
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <Moon
            size={20}
            strokeWidth={1.5}
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">Theme</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center space-x-3"
          onClick={() => setCurrentTheme("light")}
        >
          <Sun size={16} />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center space-x-3"
          onClick={() => setCurrentTheme("dark")}
        >
          <Moon size={16} />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center space-x-3"
          onClick={() => setCurrentTheme("system")}
        >
          <Monitor size={16} />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
