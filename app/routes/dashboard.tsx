import * as React from "react";
import { useState } from "react";
import { Link, redirect } from "react-router";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getAuth } from "@clerk/react-router/ssr.server";
import type { Route } from "./+types/dashboard";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Link as LinkIcon,
  Check,
  Copy,
  CalendarClock,
  MousePointerClick,
  Edit,
  Trash,
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
    originalUrl: "https://www.youtube.com/watch?v=uUhX0T7IZaI",
    clicks: 1247,
    createdAt: "2024-01-15",
    country: "US",
    expiresAt: "2024-02-15",
  },
  {
    id: 2,
    shortUrl: "def456",
    originalUrl: "https://another-example.com/another-very-long-url",
    clicks: 892,
    createdAt: "2024-01-14",
    country: "UK",
    expiresAt: null,
  },
  {
    id: 3,
    shortUrl: "ghi789",
    originalUrl: "https://third-example.com/yet-another-long-url",
    clicks: 634,
    createdAt: "2024-01-13",
    country: "CA",
    expiresAt: "2024-02-15",
  },
  {
    id: 4,
    shortUrl: "jkl012",
    originalUrl: "https://fourth-example.com/final-long-url-example",
    clicks: 423,
    createdAt: "2024-01-12",
    country: "AU",
    expiresAt: "2024-02-15",
  },
  {
    id: 5,
    shortUrl: "mno345",
    originalUrl: "https://fifth-example.com/final-long-url-example",
    clicks: 321,
    createdAt: "2024-01-11",
    country: "NZ",
    expiresAt: "2024-02-15",
  },
  {
    id: 6,
    shortUrl: "pqr678",
    originalUrl: "https://sixth-example.com/final-long-url-example",
    clicks: 210,
    createdAt: "2024-01-10",
    country: "UK",
    expiresAt: "2024-02-15",
  },
  {
    id: 7,
    shortUrl: "stu901",
    originalUrl: "https://seventh-example.com/final-long-url-example",
    clicks: 105,
    createdAt: "2024-01-09",
    country: "AU",
    expiresAt: "2024-02-15",
  },
];

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // console.log("Dashboard loaderData:", loaderData);

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
      <Header onDashboard />
      <main className="c-root grow flex mb-4 w-full justify-center">
        <section className="flex flex-col w-full">
          {/* <header className="h-full flex justify-between py-4 items-center gap-4 sticky top-16 z-10 border-b backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-card/30">
            <Input placeholder="Search your links" />
            <Button>
              <Plus strokeWidth={3} />
              <span className="hidden sm:inline-block">New Link</span>
            </Button>
          </header> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mockLinks.map((link) => (
              <Card
                key={link.id}
                className="group p-3 w-full h-full"
                // onClick={() => console.log("clicked on card")}
              >
                <CardContent className="p-0 w-full h-full flex flex-col items-start justify-evenly">
                  <div className="flex flex-1 items-center justify-between gap-2 w-full">
                    {/* Title */}
                    <div className="flex items-center">
                      <div className="h-8 flex items-center active:bg-accent lg:hover:bg-accent lg:hover:cursor-pointer rounded-l-sm ps-2 transition-colors ease-in-out duration-300">
                        <LinkIcon className="h-4 w-4 inline-block" />
                        <Link
                          to={`${link.originalUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm font-bold px-2 py-1 rounded break-all"
                        >
                          /{link.shortUrl}
                        </Link>
                      </div>

                      {/* Copy button */}
                      <Button
                        variant="iconSecondary"
                        size="icon"
                        className="h-8 flex-shrink rounded-none rounded-r-sm"
                        onClick={(e) => handleCopy(link.shortUrl, e)}
                      >
                        {copiedLink === link.shortUrl ? (
                          <Check className=" text-green-600 dark:text-green-200" />
                        ) : (
                          <Copy />
                        )}
                      </Button>
                    </div>

                    {/* Dropdown menu for link actions */}
                    {/* <DropdownMenu>
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
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}

                    {/* Edit / delete buttons */}
                    <div className="flex">
                      <Button
                        variant="icon"
                        className="rounded-none rounded-l-sm px-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="icon"
                        className="rounded-none rounded-r-sm px-2"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p
                    className="font-mono text-xs mb-2 text-foreground/50 truncate select-all w-full"
                    title={link.originalUrl}
                  >
                    {link.originalUrl}
                  </p>

                  {/* Click and date info */}
                  <div className="select-none flex flex-wrap sm:flex-nowrap mt-2 mr-1 self-end gap-3 sm:gap-6 text-xs text-foreground/65 sm:mt-0">
                    <div className="flex items-center gap-1">
                      <MousePointerClick className="w-4 h-4" />
                      <span>{link.clicks.toLocaleString()} clicks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarClock className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {!link.expiresAt
                          ? "Won't expire"
                          : new Date(link.expiresAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                      </span>
                      <span className="sm:hidden">
                        {!link.expiresAt
                          ? "Won't expire"
                          : new Date(link.expiresAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                      </span>
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
