<a href="https://nuto.dev">
  <img width="1920" height="540" alt="nuto-banner" src="https://github.com/user-attachments/assets/73c219fc-0fa1-4150-89bd-5a595a5fa655" />
</a>

<p></p>

🔗 Nuto is a smart URL shortener designed to escape in-app browsers and open links where they belong: in the user's native browser or the corresponding native application. Available in English and Spanish at [nuto.dev](https://nuto.dev).

The name "Nuto" comes from the Spanish word "diminuto" (tiny), reflecting its purpose of making long URLs tiny.

🤝🏻 This project's UI was highly influenced by [Pheralb's slug](https://github.com/pheralb/slug). 🗿

  <div align="center">

  [![React Router](https://img.shields.io/badge/React_Router-CA4245?logo=react-router&logoColor=white)](#)
  [![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?logo=Cloudflare&logoColor=white)](#)
  [![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000?logo=shadcnui&logoColor=fff)](#)
  [![Check workflow](https://github.com/andesvel/nuto/actions/workflows/ci.yml/badge.svg)](https://github.com/andesvel/nuto/actions/workflows/ci.yml)
  [![Deploy workflow](https://github.com/andesvel/nuto/actions/workflows/deploy.yml/badge.svg)](https://github.com/andesvel/nuto/actions/workflows/deploy.yml)
  ![GitHub issues](https://img.shields.io/github/issues/andesvel/nuto)
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
  
</div>

<img width="2718" height="1984" alt="nuto-dashboard-desktop" src="https://github.com/user-attachments/assets/4017498b-04f4-4685-9f08-79f581a12351" />

## 📚 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Testing and Code Quality](#-testing-and-code-quality)
- [Deployment](#️-deployment)
- [Contributing](#-contributing)
- [Roadmap](#️-roadmap)
- [Known Issues](#-known-issues)
- [Related projects](#-related-projects)
- [License](#️-license)

## ✨ Key Features

- **In-App Browser Escape**: Short links opened inside Instagram, TikTok, Facebook, Messenger, Threads, X, Snapchat, LinkedIn, WhatsApp, Telegram, Pinterest, Reddit, Discord and other in-app browsers jump to the device's real browser. The whole site does it too: opening `nuto.dev` from an Instagram chat reopens it in Safari or Chrome, and a banner offers it again if you come back.
- **Deep Linking**: On Android, links to 20+ apps open straight in the app from any browser, with the web as fallback: YouTube, YouTube Music, Spotify, Apple Music, SoundCloud, Deezer, Amazon Music, Twitch, Netflix, Prime Video, Disney+, Instagram, Threads, TikTok, X, WhatsApp, Telegram, Discord, LinkedIn, Amazon, Mercado Libre and Google Maps. On iOS, YouTube, Spotify and WhatsApp links open their apps from in-app browsers; everything else goes to Safari, where each app's universal links take over.
- **QR Codes**: Every link has a QR code (brand or black, transparent background, optional logo) to download as PNG or SVG or copy. Scans are counted separately from taps.
- **Analytics**: Clicks over time, change against the previous period, share of clicks rescued from in-app browsers, QR scans, top links, apps, countries, devices and busiest hours, for 7/30/90 days or all time, per link or overall, with a live view of the last hour.
- **Password Protection**: Visitors enter a password before being redirected. Passwords are hashed with salted PBKDF2, attempts are rate limited, and owners reveal them on demand.
- **Link Expiration**: Links stop redirecting after a date you pick and answer 410 Gone.
- **Custom Short Codes**: Pick your own code or generate one.
- **Privacy-Friendly**: Clicks store only time, country, user agent and derived app/device/QR flags. IP addresses are never stored.
- **English and Spanish**: The whole app, Clerk's sign-in included, with Spanish pages under `/es`.
- **SEO and AI-ready**: Canonical and hreflang tags, a bilingual sitemap, Open Graph images per language, JSON-LD (WebApplication and FAQ) and an `llms.txt`.
- **Authentication**: Email, GitHub and Google sign-in, managed with [Clerk](https://clerk.com).

## 🛠️ Tech Stack

- **Framework**: [React Router v7](https://reactrouter.com/) in framework mode with SSR (loaders and actions are the backend)
- **Platform**: [Cloudflare](https://www.cloudflare.com/)
  - **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) (works on the free plan)
  - **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
  - **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/) for redirects
  - **Rate limiting**: [Workers rate limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) for password attempts
- **UI & Frontend**:
  - **Library**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) (strict)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  - **Components**: [shadcn/ui](https://ui.shadcn.com/) (using Radix UI primitives)
  - **Charts**: hand-written SVG, no chart library
  - **QR codes**: [uqr](https://github.com/unjs/uqr), rendered in the browser
  - **Icons**: [Lucide React](https://lucide.dev/) and [React Simple Icons](https://github.com/icons-pack/react-simple-icons)
  - **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Authentication**: [Clerk](https://clerk.com/) with [`@clerk/localizations`](https://clerk.com/docs/customization/localization)
- **i18n**: typed message dictionaries in `app/i18n`, no i18n library
- **Testing**: [Vitest](https://vitest.dev/) with [`@cloudflare/vitest-plugin`](https://developers.cloudflare.com/workers/testing/vitest-integration/) (real D1 and KV through Miniflare)
- **Tooling**: [Vite](https://vitejs.dev/), [pnpm](https://pnpm.io/), [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## 🚀 Getting Started

### Prerequisites

You will need the following to run Nuto locally:

- [Node.js v22.14+](https://nodejs.org/)
- [pnpm v10.14+](https://pnpm.io)
- A [Clerk account](https://clerk.com) for authentication. *Note: You must configure a Clerk Webhook with user management events for proper ID synchronization. See [Clerk Webhooks docs](https://clerk.com/docs/webhooks/sync-data/).* Social providers (GitHub, Google) are enabled in the Clerk dashboard; the app needs no OAuth credentials.
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) for D1 and KV.

Wrangler comes with the project's dev dependencies; run it with `pnpm exec wrangler`.

### 1. Installation

```bash
git clone https://github.com/andesvel/nuto.git
cd nuto
pnpm install
```

### 2. Environment Setup

Non-secret variables (`VITE_CLERK_PUBLISHABLE_KEY` and Clerk's redirect URLs) live in `wrangler.jsonc` under `vars`. Put the secrets in `.dev.vars` (gitignored):

```env
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."
# base64-encoded 32 random bytes, e.g. `openssl rand -base64 32`
PASSCODE_ENC_KEY="..."
```

### 3. Local Database

Create the local D1 schema once:

```bash
pnpm exec wrangler d1 execute nuto-db --local --file=./schema.sql
```

### 4. Development Server

```bash
pnpm dev
```

Your application will be available at http://localhost:5173. `pnpm preview` builds and serves the production bundle instead (with the production Content-Security-Policy).

## 🧪 Testing and Code Quality

```bash
pnpm vitest run       # full suite against real D1/KV via Miniflare (what CI runs)
pnpm run typecheck    # wrangler types + react-router typegen + tsc
pnpm exec eslint app components utils
```

## ☁️ Deployment

Cloudflare Workers handles both the SSR routing (via React Router) and the API.

### 1. Provision Cloudflare Resources (First time only)

Log in to Cloudflare:

```bash
pnpm exec wrangler login
```

Create the D1 database:

```bash
pnpm exec wrangler d1 create nuto-db
```

*(Update `wrangler.jsonc` with the new `database_id`)*

Create the KV namespace (for production and preview):

```bash
pnpm exec wrangler kv namespace create URL_STORE
pnpm exec wrangler kv namespace create URL_STORE --preview
```

*(Update `wrangler.jsonc` with the corresponding `id` and `preview_id`)*

The password rate limiter (`PASSWORD_LIMITER`) is declared in `wrangler.jsonc` and needs no setup.

### 2. Configure Secrets

```bash
pnpm exec wrangler secret put CLERK_SECRET_KEY
pnpm exec wrangler secret put PASSCODE_ENC_KEY
pnpm exec wrangler secret put CLERK_WEBHOOK_SECRET
```

### 3. Initialize the Database

For a new database, apply the full schema:

```bash
pnpm exec wrangler d1 execute nuto-db --remote --file=./schema.sql
```

For an existing database created from an older schema, run the numbered files in `migrations/` that it hasn't had yet, **before** deploying the code that needs them:

```bash
pnpm exec wrangler d1 execute nuto-db --remote --file=./migrations/0002_click_attribution.sql
```

### 4. Deploy

```bash
pnpm deploy
```

In this repository, deploys run from GitHub Actions instead: every push to `main` deploys after checking that `main` is a merge of a `dev` commit that passed CI.

## 🤝 Contributing

Work flows from small to big: a feature branch (`feat/`, `fix/`, `refactor/`, `test/`, `docs/`) → `dev` → `main`.

- Open pull requests against `dev`. CI (`Code Quality & Tests`: eslint, typecheck, Vitest) runs on every PR and push to `dev`.
- `main` is production. It only receives `dev` through a merge commit, and each push to it deploys to Cloudflare Workers.
- Keep commits small and atomic, and run the test suite before each one.

`AGENTS.md` documents the codebase conventions (data access, KV cache, i18n, analytics, security) in more detail.

## 🗺️ Roadmap

Here's a look at the current state and future plans for Nuto.

- ✅ **Stable**
- 🚧 **In Development**
- 🤔 **To Be Decided (TBD)**

| Feature | Status | Details |
| :--- | :---: | :--- |
| **Core Functionality** | ✅ | URL shortening, redirection, in-app browser escape and click tracking. |
| **Link Management** | ✅ | Create, view, edit, delete, search and sort links. |
| **UI/UX** | ✅ | Click-to-copy, notifications, responsive design, view transitions, light and dark themes. |
| **Security** | ✅ | Password-protected links, expiration dates, rate limiting, CSP. |
| **Authentication** | ✅ | Email, GitHub and Google through Clerk. |
| **QR Codes** | ✅ | Generation, styling and export (PNG/SVG), with scan tracking. |
| **Dashboard Analytics** | ✅ | Charts, breakdowns, per-link analytics and a live view. |
| **Languages** | ✅ | English and Spanish, with Spanish SEO. |
| **Custom Domains** | 🤔 | Short links on your own domain. |
| **Link Organization** | 🤔 | Tags or folders for large link lists. |

## 🐛 Known Issues

No known issues right now. Found one? [Open an issue](https://github.com/andesvel/nuto/issues/new?labels=bug&template=bug_report.md).

## 🔗 Related projects

- [slug](https://github.com/pheralb/slug) - 🌱 An open-source URL shortener built with T3 Stack.
- [midu.link](https://github.com/midudev/midu.link) - Create shorten urls easily with Cloudfare Workers.
- [inapp-debugger](https://github.com/shalanah/inapp-debugger) - Test common in-app issues.
- [inapp-spy](https://github.com/shalanah/inapp-spy) - Detect in-app browsers.
- [Bowser](https://github.com/bowser-js/bowser) - A browser detector.
- [Sink](https://github.com/ccbikai/Sink) - A Simple / Speedy / Secure Link Shortener with Analytics, 100% run on Cloudflare.
- [Kutt](https://github.com/thedevs-network/kutt) - Free Modern URL Shortener.
- [ZWS](https://github.com/zws-im/zws) - Shorten URLs using invisible spaces.

## ⚖️ License

This project is licensed under the [GNU General Public License v3.0](LICENSE)
