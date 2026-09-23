# CLAUDE.md

## Project

Nuto is a URL shortener that runs entirely on Cloudflare Workers: SSR with React Router v7 (loaders/actions as the backend), Clerk for auth, D1 for persistence, and KV as the redirect cache. It is NOT a standalone API and has no separate server — all backend logic lives inside the React Router routes.

## Structure

```
app/                    # React Router v7 app (root, entry.server, css)
  routes/               # Routes with loaders/actions (the project's real backend)
    __tests__/          # Route integration tests (vitest-pool-workers + real D1/KV via miniflare)
  repository/           # Data-access layer (urls, clicks, users, KV redirect cache)
components/             # React components (landing, dashboard, links)
  ui/                   # shadcn/ui primitives (Radix)
  links/                # Link management UI (create/edit/delete/sort)
  icons/                # Brand logos
lib/                    # cn() helper (tailwind-merge + clsx)
utils/                  # Shared utilities (AES-GCM crypto, cycle detection, short code validation, link limits, etc.)
  __tests__/            # Utils unit tests
workers/                # Worker entry point (workers/app.ts: fetch + scheduled)
types/                  # Cloudflare Env type augmentation
public/                 # Static assets
.github/workflows/      # CI (eslint + typecheck + vitest; deploy to Workers on push to main)
schema.sql              # D1 schema (users, urls, clicks, settings, user_limits + limit trigger)
```

Root config: `wrangler.jsonc` (D1 binding `DB`, KV `URL_STORE`, cron `0 0 * * *`), `react-router.config.ts` (ssr: true), `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `eslint.config.js`, `components.json`.

## Constraints

**Privacy & Security**

- MUST NOT store IPs in click analytics — the `clicks` table only stores `url_id`, `clicked_at`, `country`, `user_agent` (schema.sql); the INSERTs in redirect.tsx respect this. Preserve it.
- MUST treat any webhook payload (Clerk) as untrusted until verified with svix — current pattern in `app/routes/webhooks.clerk.tsx` (verifies the signature before touching D1). Preserve it.
- MUST use parameterized queries (`.bind()`) — NEVER concatenate user input directly into a SQL string. All current SQL uses `.bind()`.
- NEVER log or expose env secrets (`PASSCODE_ENC_KEY`, `CLERK_WEBHOOK_SECRET`, etc.)

**Architecture**

- Backend MUST live inside React Router v7 (loaders/actions) — NEVER add a separate server framework (Express, Fastify, etc.)
- `workers/app.ts` MUST stay a thin entry point: `fetch` delegates to React Router, `scheduled` only runs the expired-links cleanup — NEVER put business logic there
- If phase 1 of this same prompt has already run: data access MUST go through `app/repository/` — NEVER call `context.cloudflare.env.DB.prepare()` directly from a loader/action

**Stack**

- MUST use React Router v7 in framework mode (ssr: true) — NEVER switch to another meta-framework
- MUST use Cloudflare D1 (persistence) and KV (`URL_STORE`, redirect cache) — NEVER introduce another external database
- MUST use Clerk for auth — NEVER roll our own auth
- MUST use shadcn/ui (Radix UI) + Tailwind CSS
- MUST use TypeScript in strict mode (verified: `strict: true` in tsconfig.json and its referenced projects)
- MUST use pnpm as the package manager (CI uses pnpm 10.14.0; there is a pnpm-lock.yaml) — NEVER npm or yarn

**Deploy**

- MUST deploy to Cloudflare Workers via Wrangler (`pnpm deploy` = build + wrangler deploy; CI deploys on push to main)
- NEVER change the wrangler.jsonc bindings (D1/KV) without confirming with me — production data is tied to those bindings

## Pending (do NOT advance — ask me first)

- Link password hashing is unsalted SHA-256 (`hashPassword` in api.links.tsx, verification in redirect.tsx) — whether to harden it is pending until we discuss it, due to compatibility with already-saved passwords. The hash is also stored in KV (`storedHash`), and its first 16 chars are used as the verifier for the `pw_<slug>` cookie.
- `app/routes/dashboard.tsx:40-74`: dead action (no form posts to `/dashboard`; the UI uses `/api/links`) that would insert links with zero validation and would store the password in plaintext (unhashed) in the `password` column.
- `app/routes/webhooks.clerk.tsx:96-97`: `user.updated` does `.bind(..., undefined, ...)` for `subscription_plan` — D1 does not accept `undefined` in bind; the event likely fails at runtime with a 500.
- The dashboard loader decrypts `password_enc` and returns the passwords in plaintext to the client in the loader data (so the user can see them). This is the current design, but it's worth confirming it's intentional.
- Any other security findings that come up during the phase 1 audit
