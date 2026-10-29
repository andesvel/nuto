# Nuto Repository Context

## Project Overview

Nuto is a URL shortener that runs entirely on Cloudflare Workers. It's a React Router v7 app in framework mode with SSR enabled: loaders and actions are the backend, Clerk handles auth, D1 provides persistence, and KV acts as the redirect cache.

**Live site:** <https://nuto.dev>

It's not a standalone API and has no separate server. All backend logic lives inside the React Router routes, and it should stay that way.

## Tech Stack

- **Framework:** React Router v7 (framework mode, `ssr: true`)
- **Auth:** Clerk (`@clerk/react-router`)
- **Database:** Cloudflare D1
- **Cache:** Cloudflare KV (`URL_STORE`, the redirect cache)
- **UI:** Tailwind CSS with shadcn/ui (Radix)
- **Language:** TypeScript in strict mode
- **Testing:** Vitest with `@cloudflare/vitest-plugin` (real D1 and KV via miniflare)
- **i18n:** typed message dictionaries in `app/i18n` (no i18n library); Clerk via `@clerk/localizations`
- **Package manager:** pnpm (CI uses 10.14.0, there's a `pnpm-lock.yaml`). Never npm or yarn.

## Project Structure

```text
app/                    # React Router v7 app (root, entry.server, css)
  routes/               # Routes with loaders/actions (the project's real backend)
    __tests__/          # Route integration tests (vitest-plugin + real D1/KV)
  repository/           # Data-access layer (urls, clicks, users, KV redirect cache)
    __tests__/          # Repository tests against real D1/KV
components/             # React components (landing, dashboard, links)
  ui/                   # shadcn/ui primitives (Radix)
  links/                # Link management UI (create/edit/delete/sort)
  icons/                # Brand logos
lib/                    # cn() helper (tailwind-merge + clsx)
utils/                  # Shared utilities (AES-GCM crypto, cycle detection,
  __tests__/            #   short code validation, link input) + unit tests
workers/                # Worker entry point (workers/app.ts: fetch + scheduled)
types/                  # Cloudflare Env type augmentation
public/                 # Static assets
.github/workflows/      # ci.yml (eslint + typecheck + vitest on dev) and
                        #   deploy.yml (verified deploy on push to main)
schema.sql              # D1 schema (users, urls, clicks, settings, user_limits
                        #   + trigger that enforces per-user link limits)
migrations/             # One-off SQL for databases created from an older
                        #   schema.sql (run manually, before deploying)
```

## Key Commands

### Development

```bash
pnpm dev              # Start dev server (React Router + Cloudflare Vite plugin)
pnpm build            # Production build (react-router build + wrangler build)
pnpm preview          # Build and preview the production bundle
pnpm deploy           # Build + wrangler deploy
```

### Code quality

```bash
pnpm run typecheck    # wrangler types + react-router typegen + tsc -b
pnpm exec eslint .    # Lint (CI runs this on fresh checkouts)
```

### Testing

```bash
pnpm vitest run       # Full test suite (this is what CI runs)
pnpm test             # Same suite through vitest directly
```

Route and repository tests run against real D1 and KV bindings via miniflare, applying `schema.sql?raw` to a fresh database in `beforeAll`.

## Git Workflow

Work flows from small to big: feature branch → `dev` → `main`. `dev` is the implementation branch; `main` is production and only receives `dev` through PRs merged with "Create a merge commit" (no direct pushes, no squash or rebase merges, which the deploy guard rejects).

Standing rules:

- One branch per task, named by purpose: `feat/`, `fix/`, `refactor/`, `test/`, `docs/`.
- Base feature branches on `dev` (or on another feature branch when tasks build on each other; review stacked branches bottom-up).
- Small, atomic commits. Each commit is one related set of changes with a message that says what changed and why.
- Run the full test suite before every commit, not just at the end.
- Never open a PR, merge, or deploy anything without explicit approval.
- Never commit secrets. `.dev.vars` and `.env` are gitignored; keep it that way.

## Environment Setup

Local secrets live in `.dev.vars` (gitignored):

- `CLERK_SECRET_KEY` — Clerk backend API key
- `CLERK_WEBHOOK_SECRET` — svix secret used to verify Clerk webhooks
- `PASSCODE_ENC_KEY` — base64 32-byte key for AES-GCM link-password encryption

Non-secret vars (`VITE_CLERK_PUBLISHABLE_KEY`, Clerk redirect URLs) are defined in `wrangler.jsonc` under `vars`.

The per-user link limit lives only in D1: `user_limits.max_links` overrides `settings.default_max_links_per_user`. `getLinkUsageForUser` reads it for the API and the dashboard, and the `prevent_excess_urls` trigger enforces the same values on insert.

Social sign-in (GitHub, Google) is configured in the Clerk dashboard; the app holds no OAuth credentials. `/sign-in/*` and `/sign-up/*` are splat routes because Clerk renders its steps (sso-callback, factor-one, verify-email-address) under them.

## Backend conventions

- All backend logic lives in React Router loaders and actions. Don't add a separate server framework (Express, Fastify, etc.).
- All data access goes through `app/repository/`. Never call `context.cloudflare.env.DB.prepare()` (or `URL_STORE`) directly from a loader or action.
- `workers/app.ts` stays a thin entry point: `fetch` delegates to the React Router request handler, and `scheduled` only runs the expired-links cleanup. No business logic there.
- `/:slug` (`app/routes/redirect.ts`) is a resource route: no root loader (Clerk), no React render, just KV/D1 and a 302. Anything that needs a page (password wall, missing or expired link) redirects to `/p/:slug` (`app/routes/link-gate.tsx`), which renders the wall, handles the password POST and throws the 404/410. Shared redirect logic lives in `app/lib/redirect.server.ts`.
- Where a short link sends a visitor is decided by `planOpen` (`utils/open-plan.ts`): desktop gets a 302; on phones, links to apps in `utils/deep-links.ts` open the app (Android: package intent with the web URL as fallback; iOS: the app's scheme through the open page, falling back to the web), and in-app browsers (`utils/in-app-detect.ts`) get the open page, which tries the app, then Safari/the default browser, then shows manual instructions. The open page (`app/lib/open-page.server.ts`) is plain HTML with its own nonce CSP; add apps to the registry with tests rather than special-casing them elsewhere.
- The redirect flow is KV first, D1 on miss. Expired links (checked on KV hits too) drop their KV entry and get a 410 from `/p/:slug`; the nightly cron deletes the D1 row. KV entries never outlive the link: `putRedirectEntry` derives the KV expiration from `expiresAt`, capped at 30 days.
- KV entries are versioned (`v` in `app/repository/url-cache.ts`); bump the version when the shape changes so older entries are read as a miss and repopulated from D1.
- Anything that deletes links from D1 (API, cron, `user.deleted`) must also delete their KV entries.
- Every query uses `.bind()` parameters. Never concatenate user input into a SQL string.

## Security and privacy

- The `clicks` table stores only `url_id`, `clicked_at`, `country`, `user_agent`, and three values derived at click time by `utils/click-attribution.ts`: `source` (`qr` for the `?q` marker), `app` (in-app browser key) and `device` (ios/android/desktop/other). Never add IP storage or other personal data to click analytics.
- Treat any webhook payload as untrusted until verified with svix. Verification happens before the first DB write in `app/routes/webhooks.clerk.tsx`; keep that ordering.
- Never log or expose env secrets (`PASSCODE_ENC_KEY`, `CLERK_WEBHOOK_SECRET`, etc.), and don't log user emails or IDs.
- The dashboard never ships link passwords. Its loader only says whether a link has one; the owner reveals a password on demand through `/api/links/password` (owner-only, `no-store`), which decrypts `password_enc`.
- Link passwords are hashed with salted PBKDF2 (`utils/password-hash.ts`). Legacy unsalted SHA-256 hashes still verify and are re-hashed on the next successful unlock. KV stores a fingerprint of the hash, never the hash itself.
- The password-wall cookie (`pw_<slug>`) is an HMAC-signed, server-side-expiring token (`utils/link-access.ts`) keyed from `PASSCODE_ENC_KEY` via HKDF. A protected link always requires a valid cookie (fail closed).
- Password attempts are rate limited per slug + client IP through the `PASSWORD_LIMITER` binding. The IP is only the limiter key; never store it.
- Link input is validated before any write (`utils/validate-link-input.ts`): http(s) only, length limits, and `expiresAt` at least a minute ahead.
- `/api/links` mutations reject a mismatched `Origin` (CSRF). `entry.server.tsx` sets the security headers and, in production builds, a full CSP (`utils/csp.ts`): scripts only from this origin, the per-request nonce (passed to `<Scripts>`, `<ScrollRestoration>`, React's stream and our inline scripts via `useNonce()`), Clerk's Frontend API (decoded from the publishable key) and Cloudflare Turnstile. A new third-party script or inline `<script>` needs the nonce or a CSP entry.
- Never change the `wrangler.jsonc` bindings (D1 `DB`, KV `URL_STORE`, rate limiter `PASSWORD_LIMITER`) without confirmation. Production data is tied to those bindings.

## Languages (i18n)

- English and Spanish (neutral Latin American, "tú"). Every UI string lives in `app/i18n/messages/en.ts`; `es.ts` must match its shape (the `Messages` type enforces it, and `app/i18n/__tests__/locales.test.ts` checks arrays and arities). Components read strings with `useT()`; meta functions and actions use `messagesFor(locale)`.
- Indexable pages (`/`, `/privacy`, `/disclaimer`) take their language from the URL: English at the root, Spanish under `/es`. Everything else (dashboard, sign-in, `/p/:slug`, API errors) follows the `nuto_lang` cookie, then `Accept-Language`. `resolveLocale()` implements both; the root loader exposes it.
- Never redirect by language. The banner offers the other version, and the switcher or banner sets the cookie and does a full page load (Clerk can't switch its language at runtime without breaking its modal).
- `es` and `en` are reserved short codes. Legal pages keep their prose per language in `components/legal/`.
- Validators and API helpers return message keys (`ErrorCode`), translated for the request's locale at the edge of the API.

## Analytics

- `/dashboard/analytics` is its own route next to `/dashboard` (tabs in the header), so the links page never runs analytics queries. `getAnalytics` aggregates in one D1 batch scoped to the user's links and range; bounded ranges return hourly UTC buckets that the client regroups by the viewer's time zone (`utils/analytics-series.ts`), so charts render after hydration.
- The live view polls `/api/analytics/live` every 15 s while the tab is visible. It reads only the last hour of clicks; keep it that way, the free plan's D1 read budget depends on it.
- Charts are plain SVG/CSS (`components/analytics/`), themed with the `--chart-*` tokens, animated only under `prefers-reduced-motion: no-preference`, and each has a visually hidden table.

## UI conventions

- Browser page translators (Chrome's "Translate this page", Safari, Firefox) replace React's text nodes. Text that changes or is rendered conditionally gets its own element (`<span>Deleting</span>`, not a bare string next to an icon), and text that changes in place is keyed by its value (`<span key={count}>`), so React swaps the element instead of touching a node the translator replaced. `utils/translator-guard.ts`, installed in `app/entry.client.tsx`, is only the safety net.
- Short codes, URLs, passwords and the brand name carry `translate="no"`.
- QR codes are generated in the browser (`utils/qr.ts` with `uqr`, dialog lazy-loaded from the link card) and encode `/<slug>?q`. Keep the `?q` marker: printed codes can't be changed later, and it's how a scan is told apart from a tap.
- Inside an in-app browser on iOS/Android (detected in the root loader with `detectInAppBrowser`), `components/in-app-escape.tsx` tries once per tab to reopen the page in the device's browser (`utils/browser-escape.ts`) and keeps a banner with a button. Don't auto-retry: the session flag is what prevents loops when an app blocks the escape.
- Dates go through `components/local-date.tsx`: the server can't know the visitor's time zone or locale, so it renders a fixed UTC format and the client swaps in the local one after hydration.


## Important files

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker config: D1 (`DB`), KV (`URL_STORE`), cron, non-secret vars. Production bindings live here. |
| `schema.sql` | D1 schema and the link-limit trigger |
| `app/routes/` | All backend logic (loaders/actions) |
| `app/repository/` | Data-access layer for D1 and KV |
| `utils/cycle-detection.ts` | Shared redirect-loop detection used by api.links and redirect |
| `utils/crypto.ts` | AES-GCM encrypt/decrypt for link passwords |
| `utils/password-hash.ts` | PBKDF2 link-password hashing and legacy SHA-256 verification |
| `utils/link-access.ts` | Signed password-wall cookie and password fingerprint |
| `utils/validate-link-input.ts` | Validation and normalization of link form input |
| `workers/app.ts` | Thin Worker entry point (fetch + scheduled cleanup) |
| `react-router.config.ts` | Enables SSR |
| `vitest.config.ts` | Cloudflare test pool with real D1/KV bindings |

## Schema changes

`schema.sql` always describes the full current schema (fresh databases and tests use it). When a change needs to reach the existing production database, also add a numbered file in `migrations/` and run it with `wrangler d1 execute nuto-db --remote --file=migrations/<file>.sql` **before** deploying code that depends on it. Fresh databases skip `migrations/`.

## Build and deploy

1. `pnpm build` runs `react-router build` and `wrangler build`.
2. `pnpm deploy` builds and deploys via Wrangler.
3. `.github/workflows/ci.yml` runs eslint, typecheck and `pnpm vitest run` on every PR to `dev` and every push to `dev`. Its job is named `Code Quality & Tests`; branch protection and the deploy guard look it up by that name.
4. `.github/workflows/deploy.yml` runs on pushes to `main` (docs-only changes skipped). It doesn't re-test: it checks that `main` is a merge of a `dev` commit with the same tree and a green `Code Quality & Tests`, then builds and deploys with the project's wrangler. Anything else aborts the deploy.
5. The `scheduled` handler runs on the `0 0 * * *` cron and deletes expired links.

## Notes for AI assistants

- `worker-configuration.d.ts` is generated by `wrangler types`. Running typecheck regenerates it and usually leaves local diff noise from wrangler version drift; discard that diff unless the update is intentional.
- `dist/`, `build/`, and `.react-router/` are build artifacts. The eslint config doesn't ignore them, so a local `eslint .` lints them and reports thousands of pre-existing problems; lint the changed source files instead.
- Don't switch the meta-framework, auth provider, or data stores: React Router v7, Clerk, D1, and KV are fixed choices.
- Use pnpm for everything that needs a package manager.
- TypeScript strict mode is on across all tsconfig projects; keep it that way.
