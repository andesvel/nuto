/* eslint-disable @typescript-eslint/no-unused-vars */
import { createRequestHandler } from "react-router";
import { deleteExpiredLinks } from "../app/repository/urls";
import { deleteRedirectEntries } from "../app/repository/url-cache";

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
  import.meta.env.MODE,
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
      const slugs = await deleteExpiredLinks(env.DB);
      await deleteRedirectEntries(env.URL_STORE, slugs);
      console.log(`Cleaned up ${slugs.length} expired links.`);
    } catch (error) {
      console.error("Error during scheduled cleanup:", error);
    }
  },
} satisfies ExportedHandler<Env>;
