import * as React from "react";
import { useEffect, useState } from "react";
import { redirect } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LinkCard from "@/components/links/link-card";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";
import type { ActionFunctionArgs } from "react-router";
import { decryptPassword } from "@/utils/crypto";

export interface Link {
  shortCode: string;
  longUrl: string;
  createdAt: string;
  expiresAt: string | null;
  password: string | null;
  clicks: number;
  lastClicked: string | null;
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  const { userId } = await getAuth({ request, context, params });

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const longUrl = formData.get("longUrl") as string;
  const shortCode = formData.get("shortCode") as string;
  const password = formData.get("password") as string;

  if (!longUrl || !shortCode) {
    return new Response("Missing required fields", { status: 400 });
  }

  try {
    await context.cloudflare.env.DB.prepare(
      "INSERT INTO urls (id, long_url, user_id, created_at, password) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        shortCode,
        longUrl,
        userId,
        new Date().toISOString(),
        password || null
      )
      .run();

    return { success: true };
  } catch (error) {
    console.error("Error creating link:", error);
    return new Response("Error creating link", { status: 500 });
  }
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in?redirect_url=" + args.request.url);
  }

  try {
    const rowsRes = await args.context.cloudflare.env.DB.prepare(
      `SELECT
         urls.id AS shortCode,
         urls.long_url AS longUrl,
         urls.created_at AS createdAt,
         urls.expires_at AS expiresAt,
         urls.password_enc AS passwordEnc,
         COUNT(clicks.id) AS clicks,
         urls.last_clicked AS lastClicked
       FROM urls
       LEFT JOIN clicks ON urls.id = clicks.url_id
       WHERE urls.user_id = ? AND (urls.expires_at IS NULL OR urls.expires_at > datetime('now'))
       GROUP BY urls.id
       ORDER BY COALESCE(urls.last_clicked, urls.created_at) DESC`
    )
      .bind(userId)
      .all();

    const raw = (rowsRes.results || []) as Array<{
      shortCode: string;
      longUrl: string;
      createdAt: string;
      expiresAt: string | null;
      passwordEnc: string | null;
      clicks: number;
      lastClicked: string | null;
    }>;

    const encKey = args.context.cloudflare.env.PASSCODE_ENC_KEY;
    const links: Link[] = await Promise.all(
      raw.map(async (r) => {
        let password: string | null = null;
        if (r.passwordEnc && encKey) {
          try {
            password = await decryptPassword(r.passwordEnc, encKey);
          } catch (e) {
            console.error("Failed to decrypt password for", r.shortCode, e);
          }
        }
        return {
          shortCode: r.shortCode,
          longUrl: r.longUrl,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt,
          password,
          clicks: Number(r.clicks) || 0,
          lastClicked: r.lastClicked,
        };
      })
    );

    return { userId, links };
  } catch (error) {
    console.error("Error fetching links:", error);
    return { userId, links: [], error: "Failed to fetch links" };
  }
}

export default function Dashboard({
  loaderData,
}: {
  loaderData: { userId: string; links: Link[]; error?: string };
}) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [links, setLinks] = useState<Link[]>(loaderData.links);

  // Update links state when loaderData.links changes
  useEffect(() => {
    setLinks(loaderData.links);
  }, [loaderData.links]);

  const handleCopy = async (shortUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`nuto.dev/to/${shortUrl}`);
      setCopiedLink(shortUrl);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header onDashboard />
      <main className="c-root grow flex mb-4 w-full justify-center">
        <section className="flex flex-col w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {links.map((link) => (
              <LinkCard
                key={link.shortCode}
                link={link}
                handleCopy={handleCopy}
                copiedLink={copiedLink}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
      {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div> */}
    </div>
  );
}
