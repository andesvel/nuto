import * as React from "react";
import { Link, useNavigation } from "react-router";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/react-router";
import { LogIn } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { Button } from "./ui/button";
import { Input } from "@ui/input";
import { Search, ArrowUpDown, Loader, ArrowRight } from "lucide-react";
import { NutoLogo } from "@components/icons/logo";

import CreateLink from "@components/links/create-link";
import SortLinks, { type SortValue } from "@/components/links/sort-links";

export default function Header({
  onDashboard,
  onDocs,
  hideSession,
  linkCount,
  searchQuery,
  onSearchChange,
  sort,
  onSortChange,
}: {
  onDashboard?: boolean;
  onDocs?: boolean;
  hideSession?: boolean;
  linkCount?: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sort?: SortValue;
  onSortChange?: (v: SortValue) => void;
}) {
  const navigation = useNavigation();
  const isNavigatingToDashboard =
    navigation.state === "loading" &&
    navigation.location.pathname === "/dashboard";
  return (
    <>
      <header className="mb-4 sticky top-0 z-50 w-full backdrop-blur-sm backdrop-saturate-150 supports-[backdrop-filter]:bg-card/30 standalone:pt-12 standalone:fixed">
        <div className="c-root flex flex-col">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <NutoLogo withText />
              {onDocs && (
                <SignedIn>
                  <Link to="/dashboard">
                    <Button
                      size="sm"
                      variant="outline"
                      className="group"
                      disabled={isNavigatingToDashboard}
                    >
                      {isNavigatingToDashboard ? (
                        <>
                          <Loader
                            size={24}
                            strokeWidth={2}
                            className="mr-2 animate-spin"
                          />
                          Loading
                        </>
                      ) : (
                        <>
                          Go to dashboard
                          <ArrowRight
                            size={24}
                            strokeWidth={2}
                            className="duration-300 group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </Button>
                  </Link>
                </SignedIn>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!onDocs && <ThemeSwitcher />}
              <div className="flex items-center">
                <Link
                  to="https://github.com/andesvel/nuto"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Nuto on GitHub</span>
                  <SiGithub
                    size={20}
                    className="hover:text-foreground transition-colors duration-200 ease-in-out"
                  />
                </Link>
              </div>
              {!hideSession && (
                <>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="ghost" className="group">
                        <LogIn
                          size={18}
                          className="duration-300 group-hover:translate-x-0.5"
                        />
                        Sign In
                      </Button>
                    </SignInButton>
                  </SignedOut>
                </>
              )}
            </div>
          </div>
          {onDashboard && (
            <header className="h-full flex justify-between py-4 items-center gap-2 border-b md:border-b-0">
              <div className="flex-1 relative md:max-w-1/2 lg:max-w-1/4">
                <Search
                  className="absolute z-10 left-2 top-1/2 -translate-y-1/2 transform text-muted-foreground"
                  size="16"
                  strokeWidth={2}
                />
                <Input
                  type="search"
                  autoComplete="off"
                  placeholder="Search your links"
                  className="pl-8"
                  value={searchQuery ?? ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                {linkCount !== undefined && (
                  <div className="h-9 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm backdrop-blur-xl backdrop-saturate-150 bg-background/30 shadow-xs">
                    <span className="font-medium text-foreground">
                      {linkCount}
                    </span>
                    <span className="text-muted-foreground">
                      / 50 <span className="hidden sm:inline">links</span>
                    </span>
                  </div>
                )}
                {sort && onSortChange && (
                  <SortLinks value={sort} onChange={onSortChange}>
                    <Button variant="outline">
                      <ArrowUpDown size={16} />
                      <span className="hidden sm:inline">Sort links</span>
                    </Button>
                  </SortLinks>
                )}
                <CreateLink />
              </div>
            </header>
          )}
        </div>
      </header>
      {/* <div className="h-0 standalone:h-8"></div> */}
    </>
  );
}
