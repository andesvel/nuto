import React from "react";
import type { Route } from "./+types/home";
import Header from "@components/header";
import Hero from "@components/hero";
import Footer from "@/components/footer";
import { Features } from "@/components/features";
// import { Separator } from "@/components/ui/separator";
import { NameOrigin } from "@/components/name-origin";
import { CtaSection } from "@/components/cta-section";
import { HowItWorks } from "@/components/how-it-works";
import { Particles } from "@/components/particles";
import { pageMeta, SITE_NAME, SITE_URL } from "@/utils/seo";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return pageMeta({
    title: "Nuto · Short links that open in native apps",
    description:
      "Free URL shortener whose links skip Instagram and TikTok in-app browsers and open YouTube, Spotify and Apple Music in their native apps. Password protection and expiring links included.",
    path: "/",
  }).concat({ "script:ld+json": STRUCTURED_DATA });
}

// Describes the site and the app to search engines and AI assistants
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description:
        "URL shortener whose links escape in-app browsers and open YouTube, Spotify and other links in their native apps.",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Escape Instagram, TikTok and Facebook in-app browsers",
        "Open YouTube and Spotify links in their native apps",
        "Custom short codes",
        "Password-protected links",
        "Expiring links",
        "Click counts",
      ],
      image: `${SITE_URL}/og.png`,
      author: { "@id": `${SITE_URL}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: "Andres Estrada",
      url: "https://github.com/andesvel",
      sameAs: ["https://github.com/andesvel"],
    },
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header onLanding />
      <main className="c-root grow flex flex-col items-center justify-start">
        <Hero />
        <HowItWorks />
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
