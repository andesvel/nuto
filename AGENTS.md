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

`GITHUB_CLIENT_*` and `GOOGLE_CLIENT_*` appear in the Env type augmentation but are not referenced by any source file.

## Backend conventions

- All backend logic lives in React Router loaders and actions. Don't add a separate server framework (Express, Fastify, etc.).
- All data access goes through `app/repository/`. Never call `context.cloudflare.env.DB.prepare()` (or `URL_STORE`) directly from a loader or action.
- `workers/app.ts` stays a thin entry point: `fetch` delegates to the React Router request handler, and `scheduled` only runs the expired-links cleanup. No business logic there.
- The redirect flow is KV first, D1 on miss. Expired links (checked on KV hits too) get deleted and return 410. KV entries never outlive the link: `putRedirectEntry` derives the KV expiration from `expiresAt`, capped at 30 days.
- KV entries are versioned (`v` in `app/repository/url-cache.ts`); bump the version when the shape changes so older entries are read as a miss and repopulated from D1.
- Anything that deletes links from D1 (API, cron, `user.deleted`) must also delete their KV entries.
- Every query uses `.bind()` parameters. Never concatenate user input into a SQL string.

## Security and privacy

- The `clicks` table stores only `url_id`, `clicked_at`, `country`, and `user_agent`. Never add IP storage to click analytics.
- Treat any webhook payload as untrusted until verified with svix. Verification happens before the first DB write in `app/routes/webhooks.clerk.tsx`; keep that ordering.
- Never log or expose env secrets (`PASSCODE_ENC_KEY`, `CLERK_WEBHOOK_SECRET`, etc.), and don't log user emails or IDs.
- Link passwords are hashed with salted PBKDF2 (`utils/password-hash.ts`). Legacy unsalted SHA-256 hashes still verify and are re-hashed on the next successful unlock. KV stores a fingerprint of the hash, never the hash itself.
- The password-wall cookie (`pw_<slug>`) is an HMAC-signed, server-side-expiring token (`utils/link-access.ts`) keyed from `PASSCODE_ENC_KEY` via HKDF. A protected link always requires a valid cookie (fail closed).
- Password attempts are rate limited per slug + client IP through the `PASSWORD_LIMITER` binding. The IP is only the limiter key; never store it.
- Link input is validated before any write (`utils/validate-link-input.ts`): http(s) only, length limits, and `expiresAt` at least a minute ahead.
- `/api/links` mutations reject a mismatched `Origin` (CSRF), and `entry.server.tsx` sets baseline security headers. A full script CSP is pending because Clerk's scripts need to be mapped first.
- Never change the `wrangler.jsonc` bindings (D1 `DB`, KV `URL_STORE`, rate limiter `PASSWORD_LIMITER`) without confirmation. Production data is tied to those bindings.

## Known issues (discuss before changing)

- The dashboard loader decrypts `password_enc` and returns the plaintext passwords to the client in the loader data (so users can see them). This is the current design, but it's worth confirming it's intentional.

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
