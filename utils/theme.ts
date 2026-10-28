export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "theme";

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system"; // storage blocked (private mode, sandboxed iframes)
  }
}

export function storeTheme(theme: Theme): void {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // the choice just won't persist
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Applies a theme to <html>: the `dark` class drives Tailwind, and
 * color-scheme makes native UI (scrollbars, date inputs, autofill) match.
 * Keep in sync with THEME_BOOT_SCRIPT, which runs before hydration.
 */
export function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

// Inline in <head> so the first paint already has the right theme (no flash).
export const THEME_BOOT_SCRIPT = `(function () {
  try {
    var t = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();`;
