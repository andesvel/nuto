import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// The theme switcher toggles the `dark` class on <html> (see root.tsx and
// theme-switcher.tsx); follow that instead of only the OS preference.
function useDocumentTheme(): "light" | "dark" {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useDocumentTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
