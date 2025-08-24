import * as React from "react";
import { Link } from "react-router";
import EditLink from "@components/links/edit-link";
import DeleteLink from "@components/links/delete-link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import type { Link as LinkType } from "app/routes/dashboard";
import {
  Link as LinkIcon,
  Check,
  Copy,
  Hourglass,
  MousePointerClick,
  Edit,
  LockKeyhole,
  LockKeyholeOpen,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LinkCard({
  link,
  handleCopy,
  copiedLink,
  loading,
}: {
  link: LinkType;
  handleCopy: (shortCode: string, e: React.MouseEvent) => void;
  copiedLink: string | null;
  loading?: boolean;
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  if (loading) {
    return (
      <Card className="group p-3 w-full h-full">
        <CardContent className="p-0 gap-4 w-full h-full flex flex-col items-start justify-evenly">
          <div className="flex flex-1 items-center justify-between gap-2 w-full">
            {/* Title */}
            <div className="flex items-center">
              <Skeleton className="w-28 h-8 flex items-center rounded-none rounded-l-sm ps-2 transition-colors ease-in-out duration-300" />

              {/* Copy button */}
              <Skeleton className="h-8 w-8 flex-shrink rounded-none rounded-r-sm" />
            </div>

            {/* Edit / delete buttons */}
            <div className="flex">
              <Skeleton className="h-8 w-8 rounded-none rounded-l-sm px-2" />
              <Skeleton className="h-8 w-8 rounded-none rounded-r-sm px-2" />
            </div>
          </div>
          <Skeleton className="font-mono text-xs w-full h-4" />

          {/* Click, password and exp. date info */}
          <div className="w-full grid grid-cols-2 min-h-8 items-center">
            <div className="w-full flex flex-wrap gap-1 text-xs sm:mt-0 items-center">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="items-center flex gap-3 sm:gap-6 text-xs text-foreground/65 sm:mt-0">
              <div className="flex items-center gap-1 w-full whitespace-nowrap">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
              <div className="flex items-center gap-1 w-full whitespace-nowrap">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card key={link.shortCode} className="group p-3 w-full h-full">
      <CardContent className="p-0 w-full h-full flex flex-col items-start justify-evenly">
        <div className="flex flex-1 items-center justify-between gap-2 w-full">
          {/* Title */}
          <div className="flex items-center">
            <div className="h-8 flex items-center active:bg-accent hover:bg-accent hover:cursor-pointer rounded-l-sm ps-2 transition-colors ease-in-out duration-300">
              <LinkIcon className="h-4 w-4 inline-block" />
              <Link
                to={`/${link.shortCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm font-bold px-2 py-1 rounded break-all"
              >
                /{link.shortCode}
              </Link>
            </div>

            {/* Copy button */}
            <Button
            type="button"
              variant="iconSecondary"
              size="icon"
              className="h-8 flex-shrink rounded-none rounded-r-sm"
              onClick={(e) => handleCopy(link.shortCode, e)}
            >
              {copiedLink === link.shortCode ? (
                <Check className=" text-green-600 dark:text-green-200" />
              ) : (
                <Copy />
              )}
            </Button>
          </div>

          {/* Edit / delete buttons */}
          <div className="flex">
            <EditLink link={link}>
              <Button variant="icon" className="rounded-none rounded-l-sm px-2">
                <Edit className="w-4 h-4" />
              </Button>
            </EditLink>
            <DeleteLink link={link} />
          </div>
        </div>
        <p
          className="font-mono text-xs mb-3 text-foreground/50 truncate select-all w-full"
          title={link.longUrl}
        >
          {link.longUrl}
        </p>

        {/* Click, password and exp. date info */}
        <div className="w-full grid grid-cols-2 min-h-8">
          <div className="flex flex-wrap sm:flex-nowrap mt-2 gap-1 text-xs text-foreground/65 sm:mt-0 items-center">
            {link.password ? (
              <>
                <LockKeyhole className="w-4 h-4" />
                <span className="flex items-center gap-1">
                  {showPassword ? (
                    <span className="font-mono select-all">
                      {link.password}
                    </span>
                  ) : (
                    <span className="tracking-wider select-none">••••••••</span>
                  )}
                  <Button
                    type="button"
                    variant="iconSecondary"
                    size="icon"
                    className="h-5 w-5"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </span>
              </>
            ) : (
              <>
                <LockKeyholeOpen className="w-4 h-4" />
                <span className="select-none">No password</span>
              </>
            )}
          </div>
          <div className="select-none flex flex-nowrap sm:flex-nowrap mt-2 mr-1 self-end place-self-end gap-3 sm:gap-6 text-xs text-foreground/65 sm:mt-0">
            <div className="flex items-center gap-1 w-full whitespace-nowrap">
              <MousePointerClick className="w-4 h-4" />
              <span>{link.clicks.toLocaleString()} clicks</span>
            </div>
            <div className="flex items-center gap-1 w-full">
              <Hourglass className="w-4 h-4" />
              <span className="hidden sm:inline whitespace-nowrap">
                {!link.expiresAt
                  ? "Won't expire"
                  : new Date(link.expiresAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </span>
              <span className="sm:hidden whitespace-nowrap">
                {!link.expiresAt
                  ? "Won't expire"
                  : new Date(link.expiresAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
