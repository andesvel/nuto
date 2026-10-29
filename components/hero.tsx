import React from "react";
import { MoveDown } from "lucide-react";
import { Button } from "./ui/button";
import { GetStartedButton } from "./get-started-button";
import { useT } from "@/app/i18n";

export default function Hero() {
  const t = useT();
  return (
    <section className="w-full grow min-h-[90dvh] flex flex-col items-center justify-center text-center p-2 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center content-center mt-auto">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-balance md:text-6xl">
          {t.hero.titleStart}{" "}
          <span className="whitespace-nowrap">{t.hero.titleInApp}</span>{" "}
          {t.hero.titleEnd}
        </h1>
        <p className="mb-10 text-muted-foreground text-pretty md:text-lg">
          {t.hero.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mb-auto">
        <GetStartedButton />
        <Button asChild variant="ghost" size="lg">
          <a href="#how-it-works">{t.hero.learnMore}</a>
        </Button>
      </div>
      <a
        href="#how-it-works"
        className="mt-auto text-sm text-muted-foreground flex flex-col gap-4 items-center pb-4 hover:text-foreground transition-colors"
      >
        {t.hero.howItWorks}
        <MoveDown aria-hidden className="mx-auto" />
      </a>
    </section>
  );
}
