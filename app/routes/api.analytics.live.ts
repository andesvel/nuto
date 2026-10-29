import type { LoaderFunctionArgs } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { getLiveActivity } from "../repository/analytics";
import { findOwnedById } from "../repository/urls";

// Polled by the analytics live view. Reads only the last hour of clicks, so
// it stays cheap on the free plan's D1 limits however often it's called.
export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const db = args.context.cloudflare.env.DB;
  const link = new URL(args.request.url).searchParams.get("link");
  if (link && !(await findOwnedById(db, link, userId))) {
    return new Response("Not Found", { status: 404 });
  }

  const activity = await getLiveActivity(db, { userId, link });
  return Response.json(activity, { headers: { "Cache-Control": "no-store" } });
}
