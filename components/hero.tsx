import React from "react";
import { Link, useNavigation } from "react-router";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/react-router";
import { ArrowRight, MoveDown, Loader } from "lucide-react";

export default function Hero() {
  const navigation = useNavigation();
  const isNavigatingToDashboard =
    navigation.state === "loading" &&
    navigation.location.pathname === "/dashboard";
  return (
    <section className="w-full grow min-h-[90dvh] flex flex-col items-center justify-center text-center p-2 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center content-center mt-auto">
        <div className="backdrop-blur-sm backdrop-saturate-150 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
          Give your users a better experience
        </div>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Stop losing visitors to clunky in-app browsers
        </h1>
        <p className="mb-10 text-muted-foreground md:text-md">
          Create smart short links that route your audience straight to the apps
          they love like YouTube, Spotify, or Apple Music, skipping the in-app
          browser entirely.
        </p>
      </div>
      <div className="flex justify-center gap-4 mb-auto">
        <SignedIn>
          <Link to="/dashboard">
            <Button
              className="group"
              size="lg"
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
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="group" size="lg">
              Get started
              <ArrowRight
                size={24}
                strokeWidth={2}
                className="duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </SignInButton>
        </SignedOut>
        <Link to="#features">
          <Button variant="ghost" size="lg">
            Learn more
          </Button>
        </Link>
      </div>
      <div className="mt-auto text-sm text-muted-foreground flex flex-col gap-4 items-center pb-4">
        <p>Features</p>
        <MoveDown className="mx-auto animate-bounce text-muted-foreground" />
      </div>
    </section>
  );
}
