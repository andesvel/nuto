import React from "react";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { NonceContext } from "./nonce";
import { buildCsp, clerkFrontendApi, createNonce } from "@/utils/csp";

// Vite's dev server injects scripts of its own, so the dev build keeps only
// the framing rules; production gets the full policy (utils/csp.ts).
const DEV_CSP = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

// Applied to every HTML document
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  let shellRendered = false;
  const nonce = createNonce();
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <NonceContext.Provider value={nonce}>
      <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
    </NonceContext.Provider>,
    {
      nonce,
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    responseHeaders.set(name, value);
  }
  responseHeaders.set(
    "Content-Security-Policy",
    import.meta.env.DEV
      ? DEV_CSP
      : buildCsp({
          nonce,
          clerkHost: clerkFrontendApi(
            loadContext.cloudflare.env.VITE_CLERK_PUBLISHABLE_KEY,
          ),
        }),
  );
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
