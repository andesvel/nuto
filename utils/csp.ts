/**
 * Clerk's Frontend API host, encoded in the publishable key:
 * pk_(test|live)_<base64("<host>$")>. Null if the key doesn't parse.
 */
export function clerkFrontendApi(publishableKey: string | undefined): string | null {
  const match = /^pk_(?:test|live)_(.+)$/.exec(publishableKey ?? "");
  if (!match) return null;
  try {
    const host = atob(match[1]).replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? host : null;
  } catch {
    return null;
  }
}

/**
 * Content-Security-Policy for HTML documents. Scripts run only from this
 * origin, with the request's nonce (React Router's and React's inline
 * scripts, the theme boot script), or from the hosts Clerk needs: its
 * Frontend API (clerk-js and its chunks) and Cloudflare Turnstile (bot
 * protection on sign-up). Styles allow inline because Clerk and React
 * inject them.
 */
export function buildCsp({
  nonce,
  clerkHost,
}: {
  nonce: string;
  clerkHost: string | null;
}): string {
  const clerk = clerkHost ? `https://${clerkHost}` : "";
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      clerk,
      "https://challenges.cloudflare.com",
      "https://static.cloudflareinsights.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      clerk,
      "https://clerk-telemetry.com",
      "https://cloudflareinsights.com",
    ],
    "frame-src": ["https://challenges.cloudflare.com"],
    "worker-src": ["'self'", "blob:"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values.filter(Boolean)].join(" "))
    .join("; ");
}

/** 128 random bits, base64: a fresh script nonce for one response. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
