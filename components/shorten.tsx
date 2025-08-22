"use client";

import React from "react";
import { useFetcher, type AppLoadContext } from "react-router";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Link } from "lucide-react";
import { nanoid } from "nanoid";

export function generateShortCode() {
  return nanoid(10);
}

export async function action({
  request,
  context,
}: {
  request: Request;
  context: AppLoadContext;
}) {
  try {
    const formData = await request.formData();
    const longUrl = formData.get("longUrl") as string;
    if (!longUrl || longUrl.trim() === "") {
      throw new Error("No long URL provided");
    }
    const shortCode = generateShortCode();
    console.log(
      `[Action shorten] Storing in KV: Key=${shortCode}, Value=${longUrl}`
    );
    await context.cloudflare.env.URL_STORE.put(shortCode, longUrl, {
      expirationTtl: 60 * 60 * 24, // 1 day
    });
    console.log(`[Action shorten] Successfully stored in KV: Key=${shortCode}`);

    // Generar la URL corta usando el host y protocolo de la solicitud actual
    const requestUrl = new URL(request.url);
    const shortCode = `${requestUrl.protocol}//${requestUrl.host}/${shortCode}`;
    console.log(`[Action shorten] Generated shortCode: ${shortCode}`);

    return {
      success: true,
      submittedUrl: longUrl,
      shortCode: shortCode,
    };
  } catch (error) {
    console.error("Error shortening URL:", error);
    return {
      success: false,
      error: "Failed to shorten URL",
    };
  }
}

export default function Shorten() {
  // const initialData = useLoaderData() as {
  //   longUrl?: string;
  //   shortCode?: string;
  // };
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";

  // const displayData = fetcher.data || initialData;
  // const longUrlToDisplay =
  //   (displayData as any)?.submittedUrl ||
  //   initialData?.longUrl ||
  //   "No long url provided";
  // const shortCodeToDisplay =
  //   (displayData as any)?.shortCode ||
  //   initialData?.shortCode ||
  //   "No short url provided";

  return (
    <>
      <fetcher.Form
        method="post"
        className="flex gap-3 mx-auto max-w-72 md:max-w-96"
      >
        <Input type="url" name="longUrl" placeholder="Enter link" />
        <Button type="submit" className="group">
          <Link size={18} className="duration-300 group-hover:rotate-[14deg]" />
          {busy ? "Shortening" : "Shorten"}
        </Button>
      </fetcher.Form>
    </>
  );
}
