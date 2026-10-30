import * as React from "react";
import { useLocation, useRouteLoaderData } from "react-router";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@ui/button";
import { useT } from "@/app/i18n";
import { escapeMethod, type MobileOs } from "@/utils/browser-escape";

type InAppBrowser = { os: MobileOs; appKey: string; appName: string | null };

/**
 * Inside an app's built-in browser (Instagram, TikTok...), a banner with a
 * link that reopens the current page in the device's own browser. The
 * automatic attempt happens on the server (app/lib/site-escape.server.ts):
 * these browsers block the jump when JavaScript starts it, but follow it
 * from a tap, so this is a real link. Sign-in providers like Google refuse
 * to work in these web views, so this matters beyond comfort.
 */
export function InAppEscape() {
  const t = useT();
  const data = useRouteLoaderData("root") as
    | { inAppBrowser?: InAppBrowser | null }
    | undefined;
  const inApp = data?.inAppBrowser ?? null;
  const [dismissed, setDismissed] = React.useState(false);
  const { pathname, search, hash } = useLocation();
  // The origin is only known in the browser; until then the link points at
  // the page itself
  const [origin, setOrigin] = React.useState<string | null>(null);
  React.useEffect(() => setOrigin(window.location.origin), []);
  const here = `${pathname}${search}${hash}`;
  const method = inApp
    ? escapeMethod(`${origin ?? "https://nuto.dev"}${here}`, inApp.os, inApp.appKey)
    : null;

  // Apps that already use the default browser need no banner
  if (!inApp || !method || method.kind === "none" || dismissed) return null;

  // Where a tap can get out: a link, or window.open where only that works
  // (Facebook). Until hydration the link points at the page itself.
  const tap =
    method.kind === "redirect" ? { url: method.url, mode: "link" as const } : method.tap;
  const blocked = !tap;

  return (
    <div role="region" aria-label={t.inApp.open} className="border-b bg-muted/60 text-sm">
      <div className="c-root flex items-center justify-between gap-3 py-2">
        <p className="text-muted-foreground text-pretty">
          <span className="font-medium text-foreground">
            {t.inApp.title(inApp.appName)}
          </span>{" "}
          <span>{blocked ? t.escapePage.blockedBody : t.inApp.body}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {tap?.mode === "link" && (
            <Button asChild>
              <a href={origin ? tap.url : here}>
                <ExternalLink size={14} />
                <span>{t.inApp.open}</span>
              </a>
            </Button>
          )}
          {tap?.mode === "window" && (
            <Button onClick={() => window.open(tap.url, "_blank")}>
              <ExternalLink size={14} />
              <span>{t.inApp.open}</span>
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            aria-label={t.inApp.dismiss}
            onClick={() => setDismissed(true)}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
