import React from "react";
import type { Route } from "./+types/home";
import Header from "@components/header";
import Hero from "@components/hero";
import Footer from "@/components/footer";
import { Features } from "@/components/features";
// import { Separator } from "@/components/ui/separator";
import { NameOrigin } from "@/components/name-origin";
import { CtaSection } from "@/components/cta-section";
import { Particles } from "@/components/particles";
import { pageMeta } from "@/utils/seo";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return pageMeta({
    title: "Nuto · Short links that open in native apps",
    description:
      "Free URL shortener whose links skip Instagram and TikTok in-app browsers and open YouTube, Spotify and Apple Music in their native apps. Password protection and expiring links included.",
    path: "/",
  });
}

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header onLanding />
      <main className="c-root grow flex flex-col items-center justify-start">
        <Hero />
        <Features />
        {/* <Separator className="my-2 sm:hidden" decorative /> */}
        <NameOrigin />
        {/* <Separator className="my-2 sm:hidden" decorative /> */}
        <CtaSection />
      </main>
      <Footer />
      <Particles />
    </div>
  );
}
