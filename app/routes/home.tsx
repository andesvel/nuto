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
    { title: "Nuto · A smoother journey for your links" },
    {
      name: "description",
      content:
        "Give your audience the seamless experience they deserve. Nuto's smart links bypass frustrating in-app browsers and open directly in native apps like YouTube and Spotify.",
    },
    {
      property: "og:title",
      content: "Nuto · A smoother journey for your links",
    },
    {
      property: "og:description",
      content:
        "We fix the broken mobile link experience. Nuto seamlessly routes your visitors to their favorite native apps instead of trapping them in an in-app browser.",
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
