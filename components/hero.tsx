import React from "react";
import { MoveDown } from "lucide-react";
import { Button } from "./ui/button";
import { GetStartedButton } from "./get-started-button";

export default function Hero() {
  return (
    <section className="w-full grow min-h-[90dvh] flex flex-col items-center justify-center text-center p-2 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center content-center mt-auto">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-balance md:text-6xl">
          Stop losing visitors to clunky{" "}
          <span className="whitespace-nowrap">in-app</span> browsers
        </h1>
        <p className="mb-10 text-muted-foreground text-pretty md:text-lg">
          Short links for your bio and posts. Tapped inside Instagram or TikTok,
          they skip the built-in browser and open YouTube, Spotify or the
          visitor&apos;s own browser instead.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mb-auto">
        <GetStartedButton />
        <Button asChild variant="ghost" size="lg">
          <a href="#how-it-works">Learn more</a>
        </Button>
      </div>
      <a
        href="#how-it-works"
        className="mt-auto text-sm text-muted-foreground flex flex-col gap-4 items-center pb-4 hover:text-foreground transition-colors"
      >
        How it works
        <MoveDown aria-hidden className="mx-auto" />
      </a>
    </section>
  );
}
