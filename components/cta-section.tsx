import React from "react";
import { Link, useNavigation } from "react-router";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/react-router";
import { ArrowRight, Loader } from "lucide-react";

export function CtaSection() {
  const navigation = useNavigation();
  const isNavigatingToDashboard =
    navigation.state === "loading" &&
    navigation.location.pathname === "/dashboard";

  return (
    <section id="cta" className="w-full py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">Ready to begin?</h2>
        <p className="mt-3 mb-8 text-muted-foreground">
          Create a free account and start shortening links that open in the
          right place.
        </p>
        <div className="flex justify-center gap-4">
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
        </div>
      </div>
    </section>
  );
}
