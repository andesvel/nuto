<a href="https://nuto.dev">
  <img width="1920" height="540" alt="nuto-banner" src="https://github.com/user-attachments/assets/73c219fc-0fa1-4150-89bd-5a595a5fa655" />
</a>

<p></p>

🔗 Nuto is a smart URL shortener designed to escape in-app browsers and open links where they belong: in the user's native browser or the corresponding native application.

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
- [Building for Production](#-building-for-production)
- [Deploying with Wrangler](#️-deploying-with-wrangler)
- [Roadmap](#️-roadmap)
- [Known Issues](#-known-issues)
- [Related projects](#-related-projects)
- [License](#️-license)

## ✨ Key Features

- **In-App Browser Escape**: Detects when a link is opened inside an in-app browser (like Instagram) and redirects to the native system browser.
- **Deep Linking**: Intelligently routes URLs to native applications like YouTube and Spotify for a seamless user experience.
- **Password Protection**: Secure your links with a password.
- **Link Expiration**: Set an expiration date for temporary links.
- **Custom Short Codes**: Users can customize the short code for their links.
- **Click Analytics**: Basic, privacy-friendly click tracking (no IP addresses are stored).
- **User Authentication**: Managed with Clerk for secure sign-in and user management.

## 🛠️ Tech Stack

- **Framework**: [React Router v7](https://reactrouter.com/) (Full-stack)
- **Platform**: [Cloudflare](https://www.cloudflare.com/)
  - **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/)
  - **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
  - **Storage**: [Cloudflare KV](https://developers.cloudflare.com/kv/) for caching
- **UI & Frontend**:
  - **Library**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  - **Components**: [shadcn/ui](https://ui.shadcn.com/) (using Radix UI primitives)
  - **Icons**:
    - [Lucide React](https://lucide.dev/)
    - [React Simple Icons](https://github.com/icons-pack/react-simple-icons)
  - **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Tooling**:
  - **Build Tool**: [Vite](https://vitejs.dev/)
  - **Package Manager**: [pnpm](https://pnpm.io/)
  - **CLI**

## 🚀 Getting Started

### Prerequisites

You will need the following to run Nuto locally:

- [Node.js v22.14+](https://nodejs.org/)
- [pnpm v10.14+](https://pnpm.io)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A [Clerk account](https://clerk.com) for authentication. *Note: You must configure a Clerk Webhook with user management events for proper ID synchronization. See [Clerk Webhooks docs](https://clerk.com/docs/webhooks/sync-data/).*
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) for D1 and KV.

### 1. Installation

```bash
git clone https://github.com/YOUR_USERNAME/nuto.git
cd nuto
pnpm install
```

### 2. Environment Setup

Create the required environment files.

`.env.local` (Client-side variables):
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

`.dev.vars` (Worker/Server-side secrets):
```env
CLERK_SECRET_KEY="sk_..."
PASSCODE_ENC_KEY="..."
CLERK_WEBHOOK_SECRET="whsec_..."
```

### 3. Development Server

Start the Vite development server with HMR:

```bash
pnpm dev
```
Your application will be available at http://localhost:5173.

---

## ☁️ Deployment

Cloudflare Workers handles both the SSR routing (via React Router) and the API.

### 1. Build

```bash
pnpm build
```

### 2. Provision Cloudflare Resources (First time only)

Login to Cloudflare:
```bash
wrangler login
```

Create the D1 database:
```bash
wrangler d1 create nuto-db
```
*(Update `wrangler.jsonc` with the new `database_id`)*

Create the KV namespace (for production and preview):
```bash
wrangler kv namespace create URL_STORE
wrangler kv namespace create URL_STORE --preview
```
*(Update `wrangler.jsonc` with the corresponding `id` and `preview_id`)*

### 3. Configure Secrets

```bash
wrangler secret put CLERK_SECRET_KEY
wrangler secret put PASSCODE_ENC_KEY
wrangler secret put CLERK_WEBHOOK_SECRET
```

### 4. Initialize Database

Execute the schema against your D1 instance:
```bash
wrangler d1 execute nuto-db --file=./schema.sql
```

### 5. Deploy

```bash
pnpm deploy
```

## 🗺️ Roadmap

Here's a look at the current state and future plans for Nuto.

- ✅ **Stable**
- 🚧 **In Development**
- 🤔 **To Be Decided (TBD)**

| Feature | Status | Details |
| :--- | :---: | :--- |
| **Core Functionality** | ✅ | URL shortening, redirection, and basic click tracking. |
| **Link Management** | ✅ | Create, view, edit, and delete links. |
| **UI/UX** | ✅ | Click-to-copy, status notifications, responsive design. |
| **Security** | ✅ | Password-protected links and expiration dates. |
| **Authentication** | 🚧 | GitHub login provider is currently in development. |
| **Dashboard Analytics** | 🤔 | Advanced stats: total links/clicks, click graphs, top links. |
| **QR Codes** | 🤔 | Generation and customization of QR codes for each link. |

## 🐛 Known Issues

- **PWA Layout**: Some layout and styling issues may occur when the application is installed as a Progressive Web App (PWA), particularly around the header and safe areas on mobile devices.
- **GitHub Authentication**: The sign-in flow for GitHub is not currently functional and is being worked on.

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
