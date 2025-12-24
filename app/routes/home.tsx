import React from "react";
import type { Route } from "./+types/home";
import Header from "@components/header";
import Hero from "@components/hero";
import Footer from "@/components/footer";
import { Features } from "@/components/features";
// import { Separator } from "@/components/ui/separator";
import { NameOrigin } from "@/components/name-origin";
import { CtaSection } from "@/components/cta-section";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nuto · Open links where they belong" },
    {
      name: "description",
      content:
        "Short links that escape in-app browsers and open in the native browser. Deep-link to YouTube, Spotify and Apple Music.",
    },
    { property: "og:title", content: "Nuto · Open links where they belong" },
    {
      property: "og:description",
      content:
        "Escape in-app browsers and open links in the right place: native browser or native apps like YouTube, Spotify and Apple Music.",
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
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div>
    </div>
  );
}
