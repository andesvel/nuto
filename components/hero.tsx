import React from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/react-router";
import { ArrowRight } from "lucide-react";

export default function Hero() {
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
            <Button className="group">
              <ArrowRight
                size={18}
                className="duration-300 group-hover:translate-x-0.5"
              />
              Go to dashboard
            </Button>
          </Link>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="group">
              Get started
              <ArrowRight
                size={18}
                className="duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </section>
  );
}
