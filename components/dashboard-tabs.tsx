import * as React from "react";
import { NavLink } from "react-router";
import { BarChart3, Link2 } from "lucide-react";
import { useT } from "@/app/i18n";
import { cn } from "@/lib/utils";

/** Links / Analytics switcher; each tab is its own route with its own loader. */
export function DashboardTabs() {
  const t = useT();
  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
      isActive
        ? "bg-background text-foreground shadow-xs"
        : "text-muted-foreground hover:text-foreground",
    );
  return (
    <nav
      aria-label={t.analytics.tabs.label}
      className="inline-flex items-center gap-1 rounded-md border bg-muted/50 p-1"
    >
      <NavLink to="/dashboard" end viewTransition className={tab}>
        <Link2 aria-hidden size={16} />
        <span>{t.analytics.tabs.links}</span>
      </NavLink>
      <NavLink to="/dashboard/analytics" viewTransition className={tab}>
        <BarChart3 aria-hidden size={16} />
        <span>{t.analytics.tabs.analytics}</span>
      </NavLink>
    </nav>
  );
}
