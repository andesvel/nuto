import * as React from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import { redirect, useFetcher, useRevalidator } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LinkCard from "@/components/links/link-card";
import CreateLink from "@/components/links/create-link";
import { Button } from "@/components/ui/button";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";

import { decryptPassword } from "@/utils/crypto";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import {
  getLinkUsageForUser,
  listActiveLinksForUser,
} from "../repository/urls";

import {
  buildSearchIndex,
  DEFAULT_SORT,
  filterLinks,
  isSortValue,
  sortLinks,
  type SortValue,
} from "@/utils/link-list";

import { withViewTransition } from "@/utils/view-transition";
import { privateMeta } from "@/utils/seo";
import { localeFromMatches, messagesFor, useT } from "@/app/i18n";

const SORT_STORAGE_KEY = "nuto:link-sort";

import { toast } from "sonner";
import { Plus } from "lucide-react";

export function meta({ matches }: Route.MetaArgs) {
  return privateMeta(messagesFor(localeFromMatches(matches)).meta.dashboardTitle);
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

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in?redirect_url=" + args.request.url);
  }

  try {
    const [raw, usage] = await Promise.all([
      listActiveLinksForUser(args.context.cloudflare.env.DB, userId),
      getLinkUsageForUser(args.context.cloudflare.env.DB, userId),
    ]);

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

    return { userId, links, linkLimit: usage.limit };
  } catch (error) {
    console.error("Error fetching links:", error);
    return {
      userId,
      links: [],
      linkLimit: null,
      error: "Failed to fetch links",
    };
  }
}

export default function Dashboard({
  loaderData,
}: {
  loaderData: {
    userId: string;
    links: Link[];
    linkLimit: number | null;
    error?: string;
  };
}) {
  const t = useT();
  const [origin, setOrigin] = useState("https://nuto.dev");
  const fetcher = useFetcher();
  const busy = fetcher.state === "submitting" || fetcher.state === "loading";
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const links = loaderData.links;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>(DEFAULT_SORT);

  // Remember the chosen order in this browser. Read after hydration so the
  // first render matches the server's.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) ?? "null");
      if (isSortValue(saved)) setSort(saved);
    } catch {
      // storage blocked or corrupted value: keep the default
    }
  }, []);

  const changeSort = (next: SortValue) => {
    // Cards glide to their new positions (skipped under reduced motion)
    withViewTransition(() => setSort(next));
    try {
      localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // the choice just won't persist
    }
  };

  // Get origin on mount
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Data stays fresh by revalidating the loader when the tab comes back
  // into view (at most once a minute), not by fetching on every keystroke.
  const revalidator = useRevalidator();
  const revalidateRef = useRef(revalidator);
  revalidateRef.current = revalidator;
  useEffect(() => {
    let lastLoad = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoad < 60_000) return;
      if (revalidateRef.current.state !== "idle") return;
      lastLoad = Date.now();
      revalidateRef.current.revalidate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Every link (bounded by the user's limit) is already in loader data, so
  // search and sort run client-side
  const searchIndex = useMemo(() => buildSearchIndex(links), [links]);
  const visibleLinks = useMemo(
    () => sortLinks(filterLinks(searchIndex, query), sort),
    [searchIndex, query, sort],
  );

  const handleCopy = async (shortCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = origin + "/" + shortCode;
    try {
      const ok = await copyToClipboard(text);
      if (!ok && navigator.share) {
        // Fallback to native share if copy failed
        try {
          await navigator.share({
            title: t.dashboard.shareTitle,
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
      toast.error(t.dashboard.copyFailed);
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
        onSortChange={changeSort}
        linkCount={links.length}
        linkLimit={loaderData.linkLimit}
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
            <div className="flex flex-col items-center justify-center text-center mt-8 gap-4">
              {query ? (
                <p key={query} className="text-sm text-muted-foreground">
                  {t.dashboard.noResults(query)}
                </p>
              ) : (
                <>
                  <h3 className="text-lg font-semibold">
                    {t.dashboard.emptyTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.dashboard.emptyBody}
                  </p>
                  <CreateLink
                    linkCount={links.length}
                    linkLimit={loaderData.linkLimit}
                  >
                    <Button variant="outline">
                      <Plus strokeWidth={2} />
                      <span>{t.dashboard.createFirst}</span>
                    </Button>
                  </CreateLink>
                </>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
      {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div> */}
    </div>
  );
}
