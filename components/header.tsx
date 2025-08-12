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

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-card/30">
      <div className="flex h-16 items-center justify-between c-root">
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
        </div>
      </div>
    </header>
  );
}
