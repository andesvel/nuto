import { redirect, type LoaderFunctionArgs } from "react-router";
import { renderEscapePage } from "../lib/escape-page.server";
import { browserEscapeUrl } from "@/utils/browser-escape";
import { detectApp } from "@/utils/in-app-detect";
import { LOCALE_TAGS, messagesFor, resolveLocale } from "@/app/i18n";

// /_open?to=/some/path: the escape page for a page of this site (the root
// loader sends iOS in-app browsers here once per session). "_" can't appear
// in short codes, so the path never shadows a link.
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") ?? "/";
  // Only paths on this site: no other origins, no protocol-relative URLs
  const path = to.startsWith("/") && !to.startsWith("//") ? to : "/";
  const destination = new URL(path, url.origin).toString();

  const { os, inApp } = detectApp(request.headers.get("user-agent") ?? "");
  if (os !== "ios" || !inApp) return redirect(path);

  const locale = resolveLocale(new Request(destination, request));
  return renderEscapePage(
    {
      escapeUrl: browserEscapeUrl(destination, "ios", inApp.key),
      destination,
      app: null,
      inAppName: inApp.name,
    },
    messagesFor(locale),
    LOCALE_TAGS[locale],
  );
}
