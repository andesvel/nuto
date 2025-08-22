import * as React from "react";
import { Link } from "react-router";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/react-router";
import { LogIn } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "@ui/input";
import { Search } from "lucide-react";

import CreateLink from "@components/links/create-link";

export default function Header({
  onDashboard,
  hideSession,
}: {
  onDashboard?: boolean;
  hideSession?: boolean;
}) {
  return (
    <header className="mb-4 sticky top-0 z-50 w-full backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-card/30">
      <div className="c-root flex flex-col">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-black text-white">
                <span className="text-lg font-bold">N</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Nuto</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
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
              />
            </div>
            <CreateLink />
          </header>
        )}
      </div>
    </header>
  );
}
