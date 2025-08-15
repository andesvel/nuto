import { redirect, type AppLoadContext } from "react-router";

export async function loader({
  params,
  context,
  request,
}: {
  params: { slug: string };
  context: AppLoadContext;
  request: Request;
}) {
  const { slug } = params;
  if (!slug) {
    throw new Response("Bad Request: Short code parameter is missing.", {
      status: 400,
    });
  }

  const longUrl = await context.cloudflare.env.URL_STORE.get(slug);

  if (!longUrl) {
    console.error(
      `[Loader /${slug}] Short code "${slug}" not found in KV store.`
    );
    throw new Response("Not Found", {
      status: 404,
      statusText: "Short URL not found.",
    });
  }

  let validLongUrl: string = longUrl;
  if (
    !validLongUrl.startsWith("http://") &&
    !validLongUrl.startsWith("https://")
  ) {
    validLongUrl = `http://${validLongUrl}`;
  }

  const userAgentRaw = request.headers.get("user-agent") || "";
  const userAgent = userAgentRaw.slice(0, 500);
  const country =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).cf?.country || request.headers.get("cf-ipcountry") || null;

  try {
    new URL(validLongUrl);
  } catch (e) {
    console.error(`[Loader /${slug}] Stored URL invalid: ${longUrl}`, e);
    throw new Response("Invalid stored URL", { status: 500 });
  }

  try {
    context.cloudflare.ctx.waitUntil(
      (async () => {
        try {
          await context.cloudflare.env.DB.prepare(
            "INSERT INTO clicks (url_id, clicked_at, country, user_agent) VALUES (?, datetime('now'), ?, ?)"
          )
            .bind(slug, country, userAgent)
            .run();
        } catch (err) {
          console.error(`[Loader /${slug}] Async click log failed`, err);
        }
      })()
    );
  } catch (e) {
    console.error(
      `[Loader /${slug}] Invalid long URL stored for "${slug}": ${longUrl}. Error: ${e}`
    );
    throw new Response("Internal Server Error: The stored URL is invalid.", {
      status: 500,
    });
  }

  console.log(`[Loader /${slug}] Redirecting to: ${validLongUrl}`);
  return redirect(validLongUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export default function Redirect() {
  return null;
}
