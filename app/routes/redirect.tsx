import { redirect, type AppLoadContext } from "react-router";

export async function loader({
  params,
  context,
}: {
  params: { slug: string };
  context: AppLoadContext;
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

  try {
    new URL(validLongUrl);
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
