import { createRequestHandler } from "react-router";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },

  async scheduled(controller, env, ctx) {
    console.log("Running scheduled task: cleaning up expired links...");
    try {
      const { success } = await env.DB.prepare(
        "DELETE FROM urls WHERE expires_at IS NOT NULL AND expires_at < datetime('now')"
      ).run();

      if (success) {
        console.log("Successfully cleaned up expired links.");
      } else {
        console.error("Failed to clean up expired links.");
      }
    } catch (error) {
      console.error("Error during scheduled cleanup:", error);
    }
  },
} satisfies ExportedHandler<Env>;
