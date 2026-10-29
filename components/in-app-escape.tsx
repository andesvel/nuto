import * as React from "react";
import { useRouteLoaderData } from "react-router";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@ui/button";
import { useT } from "@/app/i18n";
import { browserEscapeUrl, type MobileOs } from "@/utils/browser-escape";

// Set once the automatic attempt has happened in this tab, so coming back
// to the in-app browser (or an app that blocks the escape) never loops.
const ATTEMPT_KEY = "nuto:in-app-escape";

type InAppBrowser = { os: MobileOs; appName: string | null };

function escapeToBrowser(os: MobileOs) {
  window.location.href = browserEscapeUrl(window.location.href, os);
}

/**
 * Inside an app's built-in browser (Instagram, TikTok...), tries once per
 * tab to reopen the current page in the device's own browser, and keeps a
 * banner with a button for when the app blocks it or the visitor returns.
 * Sign-in providers like Google refuse to work in these web views, so this
 * matters beyond comfort.
 */
export function InAppEscape() {
  const t = useT();
  const data = useRouteLoaderData("root") as
    | { inAppBrowser?: InAppBrowser | null }
    | undefined;
  const inApp = data?.inAppBrowser ?? null;
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!inApp) return;
    try {
      if (sessionStorage.getItem(ATTEMPT_KEY)) return;
      sessionStorage.setItem(ATTEMPT_KEY, "1");
    } catch {
      // Without storage we can't tell a second visit apart: banner only
      return;
    }
    escapeToBrowser(inApp.os);
  }, [inApp]);

  if (!inApp || dismissed) return null;

  return (
    <div role="region" aria-label={t.inApp.open} className="border-b bg-muted/60 text-sm">
      <div className="c-root flex items-center justify-between gap-3 py-2">
        <p className="text-muted-foreground text-pretty">
          <span className="font-medium text-foreground">
            {t.inApp.title(inApp.appName)}
          </span>{" "}
          <span>{t.inApp.body}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={() => escapeToBrowser(inApp.os)}>
            <ExternalLink size={14} />
            <span>{t.inApp.open}</span>
          </Button>
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
