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
import { Faq } from "@/components/faq";
import { Particles } from "@/components/particles";
import { pageMeta, SITE_NAME, SITE_URL } from "@/utils/seo";
import {
  LOCALE_TAGS,
  LOCALES,
  localizedPath,
  messagesFor,
  splitLocalePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/app/i18n";

export function meta({ location }: Route.MetaArgs) {
  const locale = splitLocalePath(location.pathname).locale ?? DEFAULT_LOCALE;
  const t = messagesFor(locale);
  return pageMeta({
    title: t.meta.homeTitle,
    description: t.meta.homeDescription,
    path: localizedPath(locale, "/"),
    imageAlt: t.meta.ogImageAlt,
  }).concat({ "script:ld+json": structuredData(locale) });
}

// Describes the site and the app to search engines and AI assistants, in
// the page's language
function structuredData(locale: Locale) {
  const t = messagesFor(locale);
  const pageUrl = new URL(localizedPath(locale, "/"), SITE_URL).href;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: LOCALES.map((l) => LOCALE_TAGS[l]),
        publisher: { "@id": `${SITE_URL}/#author` },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: pageUrl,
        description: t.meta.appDescription,
        inLanguage: LOCALE_TAGS[locale],
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: t.meta.features,
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
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        inLanguage: LOCALE_TAGS[locale],
        mainEntity: t.faq.items.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}

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
        <Faq />
        <CtaSection />
      </main>
      <Footer />
      <Particles />
    </div>
  );
}
