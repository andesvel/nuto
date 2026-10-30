import type { Messages } from "@/app/i18n";
import type { EscapePage } from "@/utils/open-plan";
import { createNonce } from "@/utils/csp";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// JSON inside a <script>: "<" can't close the tag
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * The page that gets a visitor out of an in-app browser. Nothing navigates
 * on its own from JavaScript (these browsers drop that): the automatic try
 * is a meta refresh while the page loads, and everything else waits for a
 * tap. The only script handles taps that need it (window.open for
 * Facebook, copying the link). When the app blocks every escape, the page
 * explains the manual route through its menu and offers to copy the link.
 */
export function renderEscapePage(
  page: EscapePage,
  t: Messages,
  lang: string,
  headers: Headers = new Headers(),
): Response {
  const nonce = createNonce();
  const blocked = !page.auto && !page.tap;
  // Three cases: nothing gets out, only a tap does, or it tries on its own
  const heading = blocked
    ? t.escapePage.blockedHeading(page.inAppName)
    : page.auto
      ? t.escapePage.heading(page.inAppName)
      : t.escapePage.tapHeading(page.inAppName);
  const body = blocked
    ? t.escapePage.blockedBody
    : page.auto
      ? t.escapePage.body
      : t.escapePage.tapBody;
  const tapIsLink = page.tap?.mode === "link";

  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
${page.auto ? `<meta http-equiv="refresh" content="0;url=${escapeHtml(page.auto)}">` : ""}
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
  .button { font:inherit; font-size:.875rem; font-weight:500; height:36px; border-radius:6px; border:1px solid var(--border);
    background:transparent; color:var(--fg); text-decoration:none; display:flex; align-items:center; justify-content:center; cursor:pointer; width:100%; }
  .primary { background:var(--primary); border-color:var(--primary); color:#fff; }
  .quiet { border:0; color:var(--muted); }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(heading)}</h1>
  <p>${escapeHtml(body)}</p>
  <div class="actions">
    ${
      page.tap
        ? tapIsLink
          ? `<a class="button primary" href="${escapeHtml(page.tap.url)}">${escapeHtml(t.escapePage.openBrowser)}</a>`
          : `<button type="button" class="button primary" id="open">${escapeHtml(t.escapePage.openBrowser)}</button>`
        : ""
    }
    ${page.app ? `<a class="button" href="${escapeHtml(page.app.url)}">${escapeHtml(t.escapePage.openApp(page.app.name))}</a>` : ""}
    <button type="button" class="button${page.tap ? "" : " primary"}" id="copy" hidden>${escapeHtml(t.escapePage.copy)}</button>
    <a class="button quiet" href="${escapeHtml(page.destination)}">${escapeHtml(t.escapePage.continueHere)}</a>
  </div>
</main>
<script nonce="${nonce}">
(function () {
  var c = ${scriptJson({
    destination: page.destination,
    windowUrl: page.tap && !tapIsLink ? page.tap.url : null,
    copied: t.escapePage.copied,
  })};
  var open = document.getElementById("open");
  if (open) open.addEventListener("click", function () { window.open(c.windowUrl, "_blank"); });
  var copy = document.getElementById("copy");
  if (navigator.clipboard) {
    copy.hidden = false;
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText(c.destination).then(function () { copy.textContent = c.copied; }, function () {});
    });
  }
})();
</script>
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
    `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
  );
  return new Response(html, { status: 200, headers: responseHeaders });
}
