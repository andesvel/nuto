import type { Messages } from "@/app/i18n";
import { createNonce } from "@/utils/csp";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * The page that gets a visitor out of an iOS in-app browser. No JavaScript:
 * these browsers drop escapes started by scripts, but honour a meta refresh
 * while the page loads (the automatic attempt) and links the visitor taps
 * (the buttons). When the app blocks both, the text explains the manual
 * route through its menu.
 */
export function renderEscapePage(
  page: {
    escapeUrl: string;
    destination: string;
    app: { name: string; url: string } | null;
    inAppName: string | null;
  },
  t: Messages,
  lang: string,
  headers: Headers = new Headers(),
): Response {
  const nonce = createNonce();
  const escapeUrl = escapeHtml(page.escapeUrl);
  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<meta http-equiv="refresh" content="0;url=${escapeUrl}">
<title>${escapeHtml(t.escapePage.title)}</title>
<style nonce="${nonce}">
  :root { --bg:#fff; --fg:#0a0a0a; --muted:#71717a; --border:#e4e4e7; --primary:#5a58ff; }
  @media (prefers-color-scheme: dark) { :root { --bg:#171717; --fg:#fafafa; --muted:#a1a1aa; --border:#27272a; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; text-align:center;
    padding:24px max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
    background:var(--bg); color:var(--fg); font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { width:100%; max-width:22rem; }
  h1 { font-size:1.15rem; margin:0 0 .5rem; }
  p { margin:0 0 1.25rem; color:var(--muted); }
  .actions { display:grid; gap:.5rem; }
  a.button { font-size:.875rem; font-weight:500; height:36px; border-radius:6px; border:1px solid var(--border);
    color:var(--fg); text-decoration:none; display:flex; align-items:center; justify-content:center; }
  a.primary { background:var(--primary); border-color:var(--primary); color:#fff; }
  a.quiet { border:0; color:var(--muted); }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(t.escapePage.heading(page.inAppName))}</h1>
  <p>${escapeHtml(t.escapePage.body)}</p>
  <div class="actions">
    <a class="button primary" href="${escapeUrl}">${escapeHtml(t.escapePage.openBrowser)}</a>
    ${page.app ? `<a class="button" href="${escapeHtml(page.app.url)}">${escapeHtml(t.escapePage.openApp(page.app.name))}</a>` : ""}
    <a class="button quiet" href="${escapeHtml(page.destination)}">${escapeHtml(t.escapePage.continueHere)}</a>
  </div>
</main>
</body>
</html>`;

  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Robots-Tag", "noindex");
  responseHeaders.set("Referrer-Policy", "no-referrer");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  responseHeaders.set(
    "Content-Security-Policy",
    `default-src 'none'; style-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
  );
  return new Response(html, { status: 200, headers: responseHeaders });
}
