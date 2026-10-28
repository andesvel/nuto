declare namespace Cloudflare {
  interface Env {
    PASSCODE_ENC_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    VITE_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    CLERK_WEBHOOK_SECRET: string;
  }
}

// Since wrangler 4.150 the generated global `Env` extends a private base
// interface instead of `Cloudflare.Env`, so secrets declared above only
// reach it through this link. Without it, typecheck passes locally (where
// .dev.vars feeds `wrangler types`) but fails in CI.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Env extends Cloudflare.Env {}
