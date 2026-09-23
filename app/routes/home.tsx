import React from "react";
import type { Route } from "./+types/home";
import Header from "@components/header";
import Hero from "@components/hero";
import Footer from "@/components/footer";
import { Features } from "@/components/features";
// import { Separator } from "@/components/ui/separator";
import { NameOrigin } from "@/components/name-origin";
import { CtaSection } from "@/components/cta-section";
import { GridBackground } from "@/components/grid-background";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nuto · A smoother journey for your links" },
    {
      name: "description",
      content:
        "Nuto short links open directly in native apps like YouTube and Spotify instead of an in-app browser.",
    },
    {
      property: "og:title",
      content: "Nuto · A smoother journey for your links",
    },
    {
      property: "og:description",
      content:
        "Nuto routes your links to the native app — YouTube, Spotify, Apple Music — instead of the in-app browser.",
    },
    { name: "twitter:card", content: "summary" },
  ];
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header />
      <main className="c-root grow flex flex-col items-center justify-start">
        <Hero />
        <Features />
        {/* <Separator className="my-2 sm:hidden" decorative /> */}
        <NameOrigin />
        {/* <Separator className="my-2 sm:hidden" decorative /> */}
        <CtaSection />
      </main>
      <Footer />
      <GridBackground />
    </div>
  );
}
