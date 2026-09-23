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
- **Testing:** Vitest with `@cloudflare/vitest-pool-workers` (real D1 and KV via miniflare)
- **Package manager:** pnpm (CI uses 10.14.0, there's a `pnpm-lock.yaml`). Never npm or yarn.

## Project Structure

```text
app/                    # React Router v7 app (root, entry.server, css)
  routes/               # Routes with loaders/actions (the project's real backend)
    __tests__/          # Route integration tests (vitest-pool-workers + real D1/KV)
  repository/           # Data-access layer (urls, clicks, users, KV redirect cache)
    __tests__/          # Repository tests against real D1/KV
components/             # React components (landing, dashboard, links)
  ui/                   # shadcn/ui primitives (Radix)
  links/                # Link management UI (create/edit/delete/sort)
  icons/                # Brand logos
lib/                    # cn() helper (tailwind-merge + clsx)
utils/                  # Shared utilities (AES-GCM crypto, cycle detection,
  __tests__/            #   short code validation, link limits) + unit tests
workers/                # Worker entry point (workers/app.ts: fetch + scheduled)
types/                  # Cloudflare Env type augmentation
public/                 # Static assets
.github/workflows/      # CI (eslint + typecheck + vitest; deploy on push to main)
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

Feature branches live in `dev`. `main` is the production branch and CI deploys to Cloudflare Workers on every push to it.

Standing rules:

- One branch per task, named by purpose: `fix/`, `refactor/`, `test/`, `docs/`.
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

Non-secret vars (`VITE_CLERK_PUBLISHABLE_KEY`, Clerk redirect URLs, `MAX_LINKS_PER_USER`) are defined in `wrangler.jsonc` under `vars`.

`GITHUB_CLIENT_*` and `GOOGLE_CLIENT_*` appear in the Env type augmentation but are not referenced by any source file.

## Backend conventions

- All backend logic lives in React Router loaders and actions. Don't add a separate server framework (Express, Fastify, etc.).
- All data access goes through `app/repository/`. Never call `context.cloudflare.env.DB.prepare()` (or `URL_STORE`) directly from a loader or action.
- `workers/app.ts` stays a thin entry point: `fetch` delegates to the React Router request handler, and `scheduled` only runs the expired-links cleanup. No business logic there.
- The redirect flow is KV first, D1 on miss. Expired entries get deleted and return 410; KV hits are repopulated with a 30-day TTL.
- Every query uses `.bind()` parameters. Never concatenate user input into a SQL string.

## Security and privacy

- The `clicks` table stores only `url_id`, `clicked_at`, `country`, and `user_agent`. Never add IP storage to click analytics.
- Treat any webhook payload as untrusted until verified with svix. Verification happens before the first DB write in `app/routes/webhooks.clerk.tsx`; keep that ordering.
- Never log or expose env secrets (`PASSCODE_ENC_KEY`, `CLERK_WEBHOOK_SECRET`, etc.).
- Never change the `wrangler.jsonc` bindings (D1 `DB`, KV `URL_STORE`) without confirmation. Production data is tied to those bindings.

## Known issues (discuss before changing)

- Link password hashing is unsalted SHA-256 (`hashPassword` in api.links.tsx, verification in redirect.tsx). Hardening is on hold for compatibility with already-saved passwords. The hash is also stored in KV (`storedHash`), and its first 16 chars are the verifier for the `pw_<slug>` cookie.
- The dashboard route in `app/routes/dashboard.tsx` has a dead action (no form posts to `/dashboard`; the UI posts to `/api/links`). If invoked, it would insert links with zero validation and store the password in plaintext (unhashed).
- The `user.updated` handler in `app/routes/webhooks.clerk.tsx` binds `undefined` for `subscription_plan`. D1 rejects `undefined` in bind, so the event likely fails at runtime with a 500.
- The dashboard loader decrypts `password_enc` and returns the plaintext passwords to the client in the loader data (so users can see them). This is the current design, but it's worth confirming it's intentional.
- The update path in api.links.tsx (handleUpdate) writes KV entries without `storedHash`, while the redirect loader's password wall requires `hasPassword && storedHash`. After editing a protected link, KV hits skip the password wall and redirect without a password until the entry expires or gets repopulated from a DB fallback.
- The GET loader of `/api/links` (`?id=...`) is unused by the UI (the dashboard uses its own loader; the UI only submits POST/PUT/DELETE forms), and its response includes the stored SHA-256 `password` hash. Worth deciding whether to remove the endpoint or drop the hash from the response.
- `app/routes/webhooks.clerk.tsx` logs user emails and IDs via `console.log`, and Workers observability is enabled, so PII persists in logs.

## Important files

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker config: D1 (`DB`), KV (`URL_STORE`), cron, non-secret vars. Production bindings live here. |
| `schema.sql` | D1 schema and the link-limit trigger |
| `app/routes/` | All backend logic (loaders/actions) |
| `app/repository/` | Data-access layer for D1 and KV |
| `utils/cycle-detection.ts` | Shared redirect-loop detection used by api.links and redirect |
| `utils/crypto.ts` | AES-GCM encrypt/decrypt for link passwords |
| `workers/app.ts` | Thin Worker entry point (fetch + scheduled cleanup) |
| `react-router.config.ts` | Enables SSR |
| `vitest.config.ts` | Cloudflare test pool with real D1/KV bindings |

## Build and deploy

1. `pnpm build` runs `react-router build` and `wrangler build`.
2. `pnpm deploy` builds and deploys via Wrangler.
3. CI (`.github/workflows/ci.yml`) runs eslint, typecheck, and `pnpm vitest run` on every push/PR to `main` and `dev`, then deploys to Workers on pushes to `main`.
4. The `scheduled` handler runs on the `0 0 * * *` cron and deletes expired links.

## Notes for AI assistants

- `worker-configuration.d.ts` is generated by `wrangler types`. Running typecheck regenerates it and usually leaves local diff noise from wrangler version drift; discard that diff unless the update is intentional.
- `dist/`, `build/`, and `.react-router/` are build artifacts. The eslint config doesn't ignore them, so a local `eslint .` lints them and reports thousands of pre-existing problems; lint the changed source files instead.
- Don't switch the meta-framework, auth provider, or data stores: React Router v7, Clerk, D1, and KV are fixed choices.
- Use pnpm for everything that needs a package manager.
- TypeScript strict mode is on across all tsconfig projects; keep it that way.
