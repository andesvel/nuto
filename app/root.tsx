import * as React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useRouteLoaderData,
} from "react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import { ClerkProvider } from "@clerk/react-router";
import { shadcn } from "@clerk/themes";
import { esES } from "@clerk/localizations";

import { Toaster } from "@/components/ui/sonner";
import { THEME_BOOT_SCRIPT } from "@/utils/theme";
import { Button } from "@/components/ui/button";
import { House } from "lucide-react";

import type { Route } from "./+types/root";
// Self-hosted Inter (variable, with optical sizing): no render-blocking
// request to Google Fonts, and the font ships from our own origin.
import "@fontsource-variable/inter/opsz.css";
import "@fontsource-variable/inter/opsz-italic.css";
import "./app.css";
// The upright latin subset is what every page renders first; preloading it
// lets the text paint in Inter instead of swapping from the fallback font.
import interLatinUrl from "@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2?url";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { LanguageBanner } from "@/components/language-banner";
import { useNonce } from "./nonce";
import { InAppEscape } from "@/components/in-app-escape";
import { detectInAppBrowser } from "@/utils/in-app-escape";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_TAGS,
  localizedPath,
  preferredLocale,
  resolveLocale,
  useLocale,
  useT,
} from "@/app/i18n";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Nuto" }];
}

export const links: Route.LinksFunction = () => [
  {
    rel: "preload",
    href: interLatinUrl,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args, ({ request }) => ({
    locale: resolveLocale(request),
    // What the visitor would rather read, for the language banner
    preferredLocale: preferredLocale(request),
    // Instagram, TikTok... on iOS/Android: the page offers to leave it
    inAppBrowser: detectInAppBrowser(request.headers.get("user-agent") ?? ""),
  }));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce();
  const data = useRouteLoaderData("root") as { locale?: unknown } | undefined;
  const locale = isLocale(data?.locale) ? data.locale : DEFAULT_LOCALE;
  return (
    <html lang={LOCALE_TAGS[locale]} suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/nuto-180.png" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#ffffff"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#171717"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <Meta />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider
      localization={loaderData.locale === "es" ? esES : undefined}
      loaderData={loaderData}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{ baseTheme: shadcn }}
    >
      <InAppEscape />
      <LanguageBanner />
      <Outlet />
    </ClerkProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = useT();
  const locale = useLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  let statusCode: number | undefined;
  let message = t.errorPage.oops;
  let details = t.errorPage.unexpected;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    // Short-link pages (/p/:slug) explain what happened to the link itself
    const isLink = pathname.startsWith("/p/");
    if (error.status === 404) {
      message = t.errorPage.notFoundTitle;
      details = isLink ? t.errorPage.linkNotFound : t.errorPage.notFound;
    } else if (error.status === 410) {
      message = t.errorPage.expiredTitle;
      details = t.errorPage.expired;
    } else {
      message = t.errorPage.error;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="flex flex-col items-center min-h-dvh justify-between antialiased">
      <Header hideSession />
      <main className="flex flex-col gap-4 justify-center p-10 -mt-50 max-w-[512px]">
        <h1 className="text-2xl font-bold font-mono">
          {statusCode && <span>{statusCode}</span>} <span>{message}</span>
        </h1>
        <p>{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto">
            <code>{stack}</code>
          </pre>
        )}
        <Button
          type="button"
          className="mt-4 group"
          onClick={() =>
            navigate(localizedPath(locale, "/"), {
              replace: true,
              viewTransition: true,
            })
          }
        >
          <House className="h-4 w-4 duration-200 group-hover:-translate-y-0.5" />
          {t.errorPage.goHome}
        </Button>
      </main>
      <Footer />
    </div>
  );
}
