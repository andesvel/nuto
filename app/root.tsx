import * as React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import { ClerkProvider } from "@clerk/react-router";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { House } from "lucide-react";

import type { Route } from "./+types/root";
import "./app.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args);
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0, minimum-scale=1.0"
        />
        <Meta />
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function() {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  })();
`,
          }}
        />
        <Links />
      </head>
      <body>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider
      loaderData={loaderData}
      afterSignOutUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <Outlet />
    </ClerkProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let statusCode: number | undefined;
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  const navigate = useNavigate();

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 && error.statusText || "Error";
    statusCode = error.status;
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.data || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="flex flex-col items-center min-h-dvh justify-between antialiased">
      <Header hideSession />
      <main className="flex flex-col gap-4 justify-center p-10 -mt-50 max-w-[512px]">
        <h1 className="text-2xl font-bold font-mono">
          {statusCode && <span>{statusCode}</span>} {message}
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
          onClick={() => navigate("/", { replace: true })}
        >
          <House className="h-4 w-4 duration-200 group-hover:-translate-y-0.5" />
          Go home
        </Button>
      </main>
      <Footer />
    </div>
  );
}
