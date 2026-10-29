import type { Messages } from "@/app/i18n";
import type { OpenPlan } from "@/utils/open-plan";
import { createNonce } from "@/utils/csp";

// How long each attempt gets before the next one. If the page is hidden by
// then, the app or browser opened and nothing else runs.
const STEP_MS = 1200;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// JSON inside a <script>: "<" can't close the tag
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * The page between a short link and its destination when a plain redirect
 * isn't enough: it tries the app, then the device's browser, and inside an
 * app that blocks both it explains how to leave by hand. Plain HTML with an
 * inline nonce'd script: no React, no Clerk, nothing else to load.
 */
export function renderOpenPage(
  plan: Extract<OpenPlan, { kind: "page" }>,
  t: Messages,
  lang: string,
  headers: Headers,
): Response {
  const nonce = createNonce();
  const config = {
    steps: plan.steps,
    fallback: plan.fallback,
    destination: plan.destination,
    stepMs: STEP_MS,
    copied: t.openPage.copied,
  };
  const destination = escapeHtml(plan.destination);

  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(t.openPage.title)}</title>
<style nonce="${nonce}">
  :root { --bg:#fff; --fg:#0a0a0a; --muted:#71717a; --border:#e4e4e7; --primary:#5a58ff; }
  @media (prefers-color-scheme: dark) { :root { --bg:#171717; --fg:#fafafa; --muted:#a1a1aa; --border:#27272a; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100dvh; display:grid; place-items:center; padding:24px max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
    background:var(--bg); color:var(--fg); font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; text-align:center; }
  main { max-width:22rem; }
  h1 { font-size:1.15rem; margin:0 0 .5rem; }
  p { margin:0 0 1.25rem; color:var(--muted); }
  .spinner { width:28px; height:28px; margin:0 auto 1rem; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spinner { animation:none; } }
  .actions { display:grid; gap:.5rem; }
  button, a.button { font:inherit; font-size:.875rem; font-weight:500; height:36px; border-radius:6px; border:1px solid var(--border);
    background:transparent; color:var(--fg); text-decoration:none; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; }
  button.primary { background:var(--primary); border-color:var(--primary); color:#fff; }
  .link { font-size:.875rem; color:var(--muted); word-break:break-all; }
  [hidden] { display:none !important; }
</style>
</head>
<body>
<main>
  <section id="opening">
    <div class="spinner" aria-hidden="true"></div>
    <h1>${escapeHtml(t.openPage.opening(plan.targetApp))}</h1>
    <noscript><p><a class="link" href="${destination}">${destination}</a></p></noscript>
  </section>
  <section id="blocked" hidden>
    <h1>${escapeHtml(t.openPage.blockedTitle(plan.inAppName))}</h1>
    <p>${escapeHtml(t.openPage.blockedBody)}</p>
    <div class="actions">
      <button type="button" class="primary" id="copy">${escapeHtml(t.openPage.copy)}</button>
      <button type="button" id="retry">${escapeHtml(t.openPage.tryAgain)}</button>
      <a class="button" href="${destination}">${escapeHtml(t.openPage.continueHere)}</a>
    </div>
  </section>
</main>
<script nonce="${nonce}">
(function () {
  var c = ${scriptJson(config)};
  var timer;
  function blocked() {
    document.getElementById("opening").hidden = true;
    document.getElementById("blocked").hidden = false;
  }
  function run(i) {
    clearTimeout(timer);
    if (i >= c.steps.length) {
      if (c.fallback) location.replace(c.fallback); else blocked();
      return;
    }
    location.href = c.steps[i];
    timer = setTimeout(function () {
      // Still here: that attempt didn't take the visitor anywhere
      if (document.visibilityState === "visible") run(i + 1);
    }, c.stepMs);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") clearTimeout(timer);
  });
  document.getElementById("retry").addEventListener("click", function () {
    document.getElementById("blocked").hidden = true;
    document.getElementById("opening").hidden = false;
    run(0);
  });
  document.getElementById("copy").addEventListener("click", function () {
    var button = this;
    var done = function () { button.textContent = c.copied; };
    if (navigator.clipboard) navigator.clipboard.writeText(c.destination).then(done, function () {});
  });
  run(0);
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
