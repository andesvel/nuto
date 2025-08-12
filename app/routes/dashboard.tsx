import * as React from "react";
import { useState } from "react";
import { Link, redirect } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";

import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Link as LinkIcon,
  Check,
  Copy,
  Calendar,
  MousePointer,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    return redirect("/sign-in?redirect_url=" + args.request.url);
  }

  return userId;
}

const mockLinks = [
  {
    id: 1,
    shortUrl: "abc123",
    originalUrl: "https://example.com/very-long-url-that-needs-shortening",
    clicks: 1247,
    createdAt: "2024-01-15",
    country: "US",
  },
  {
    id: 2,
    shortUrl: "def456",
    originalUrl: "https://another-example.com/another-very-long-url",
    clicks: 892,
    createdAt: "2024-01-14",
    country: "UK",
  },
  {
    id: 3,
    shortUrl: "ghi789",
    originalUrl: "https://third-example.com/yet-another-long-url",
    clicks: 634,
    createdAt: "2024-01-13",
    country: "CA",
  },
  {
    id: 4,
    shortUrl: "jkl012",
    originalUrl: "https://fourth-example.com/final-long-url-example",
    clicks: 423,
    createdAt: "2024-01-12",
    country: "AU",
  },
];

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  console.log("Dashboard loaderData:", loaderData);

  const handleCopy = async (shortUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`https://nuto.dev/${shortUrl}`);
      setCopiedLink(shortUrl);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header />
      <main className="c-root grow flex items-center justify-center">
        <section className="max-w-2xl w-full">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6">
            Your Links
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {mockLinks.map((link) => (
              <Card
                key={link.id}
                className="group py-4 px-4"
                // onClick={() => console.log("clicked on card")}
              >
                {/* <CardHeader> */}
                {/* <CardTitle className="flex items-center space-x-2"> */}
                {/* </CardTitle> */}
                {/* </CardHeader> */}
                <CardContent className="p-0">
                  <div className="flex flex-col items-start sm:justify-between">
                    <div className="flex items-center justify-between gap-2 mb-1 w-full">
                      {/* Title */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center lg:hover:bg-neutral-100 dark:lg:hover:bg-neutral-800 lg:hover:cursor-pointer rounded ps-2 py-1 transition-colors ease-in-out duration-300">
                          <LinkIcon className="h-4 w-4 inline-block" />
                          <Link
                            to={`${link.originalUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-700 dark:text-neutral-300 font-mono text-xs sm:text-sm font-bold px-2 py-1 rounded break-all"
                          >
                            /{link.shortUrl}
                          </Link>
                        </div>

                        {/* Copy button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ease-in-out duration-300 p-1 h-auto flex-shrink-0"
                          onClick={(e) => handleCopy(link.shortUrl, e)}
                        >
                          {copiedLink === link.shortUrl ? (
                            <Check className="text-green-600 dark:text-green-200" />
                          ) : (
                            <Copy className="text-neutral-500 dark:text-neutral-400" />
                          )}
                        </Button>
                      </div>

                      {/* Dropdown menu for link actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-start sm:self-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // handleEdit(link.id);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // handleDelete(link.id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p
                      className="mb-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-all sm:truncate"
                      title={link.originalUrl}
                    >
                      {link.originalUrl}
                    </p>

                    {/* Click and date info */}
                    <div className="flex flex-wrap sm:flex-nowrap mt-2 place-self-end gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500 sm:mt-0">
                      <div className="flex items-center gap-1">
                        <MousePointer className="w-3 h-3" />
                        <span className="font-medium text-neutral-500 dark:text-neutral-500">
                          {link.clicks.toLocaleString()} clicks
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="hidden sm:inline">
                          {new Date(link.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span className="sm:hidden">
                          {new Date(link.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      {/* <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div> */}
    </div>
  );
}
