import React from "react";
import { Link, useNavigation } from "react-router";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/react-router";
import { ArrowRight, Loader } from "lucide-react";

export default function Hero() {
  const navigation = useNavigation();
  const isNavigatingToDashboard =
    navigation.state === "loading" &&
    navigation.location.pathname === "/dashboard";
  return (
    <section className="w-full grow -mt-52">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Short links with <span className="text-primary">ease</span>
        </h1>
        <p className="mb-10 text-lg text-muted-foreground md:text-xl">
          Nuto transforms your long URLs into concise, memorable links.
        </p>
      </div>
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
    </section>
  );
}
