import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { redirect, useFetcher } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LinkCard from "@/components/links/link-card";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";
import type { ActionFunctionArgs } from "react-router";

import { decryptPassword } from "@/utils/crypto";
import { copyToClipboard } from "@/utils/copy-to-clipboard";

import type { SortValue, SortKey } from "@/components/links/sort-links";

import { toast } from "sonner";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard · Nuto" },
    { name: "description", content: "Your shortened links" },
  ];
}

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
  const [origin, setOrigin] = useState("https://nuto.dev");
  const fetcher = useFetcher();
  const busy = fetcher.state === "submitting" || fetcher.state === "loading";
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [links, setLinks] = useState<Link[]>(loaderData.links);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>({
    key: "lastClicked",
    order: "desc",
  });

  // Get origin on mount
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Update links state when loaderData.links changes
  useEffect(() => {
    setLinks(loaderData.links);
  }, [loaderData.links]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) => {
      const code = l.shortCode.toLowerCase();
      const url = l.longUrl.toLowerCase();
      // try by hostname if url is valid
      let host = "";
      try {
        host = new URL(l.longUrl).hostname.toLowerCase();
      } catch {
        // not a valid URL bro
      }
      return code.includes(q) || url.includes(q) || host.includes(q);
    });
  }, [links, query]);

  const visibleLinks = useMemo(() => {
    const arr = [...filteredLinks];

    const toTime = (s?: string | null) =>
      s ? new Date(s).getTime() : Number.NaN;

    const compare = (a: Link, b: Link) => {
      const dir = sort.order === "asc" ? 1 : -1;
      let result = 0;

      switch (sort.key as SortKey) {
        case "shortCode":
          result = a.shortCode.localeCompare(b.shortCode, undefined, {
            sensitivity: "base",
          });
          break;
        case "clicks":
          result = (a.clicks || 0) - (b.clicks || 0);
          break;
        case "expiresAt":
          result = toTime(a.expiresAt) - toTime(b.expiresAt);
          break;
        case "lastClicked": {
          // Imitate COALESCE(last_clicked, created_at)
          const atA = Number.isNaN(toTime(a.lastClicked))
            ? toTime(a.createdAt)
            : toTime(a.lastClicked);
          const atB = Number.isNaN(toTime(b.lastClicked))
            ? toTime(b.createdAt)
            : toTime(b.lastClicked);
          result = atA - atB;
          break;
        }
      }
      return dir * result;
    };

    arr.sort(compare);
    return arr;
  }, [filteredLinks, sort]);

  const handleCopy = async (shortCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = origin + "/" + shortCode;
    try {
      const ok = await copyToClipboard(text);
      if (!ok && navigator.share) {
        // Fallback to native share if copy failed
        try {
          await navigator.share({
            title: "Short link",
            text,
            url: `https://${text}`,
          });
        } catch {
          // ignore lol
        }
      }
      if (ok) {
        setCopiedLink(shortCode);
        setTimeout(() => setCopiedLink(null), 2000);
      }
    } catch (err) {
      toast.error("Failed to copy link");
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header
        onDashboard
        searchQuery={query}
        onSearchChange={setQuery}
        sort={sort}
        onSortChange={setSort}
      />
      <main className="c-root grow flex mb-4 w-full justify-center">
        <section className="flex flex-col w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {visibleLinks.map((link) => (
              <LinkCard
                key={link.shortCode}
                link={link}
                handleCopy={handleCopy}
                copiedLink={copiedLink}
                loading={busy}
              />
            ))}
          </div>
          {visibleLinks.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              No results for “{query}”.
            </p>
          )}
        </section>
      </main>
      <Footer />
      {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div> */}
    </div>
  );
}
