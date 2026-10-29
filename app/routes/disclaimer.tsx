import * as React from "react";
import type { Route } from "./+types/disclaimer";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { DisclaimerContent } from "@/components/legal/disclaimer";
import { pageMeta } from "@/utils/seo";
import {
  DEFAULT_LOCALE,
  messagesFor,
  splitLocalePath,
  useLocale,
} from "@/app/i18n";

export function meta({ location }: Route.MetaArgs) {
  const locale = splitLocalePath(location.pathname).locale ?? DEFAULT_LOCALE;
  const t = messagesFor(locale);
  return pageMeta({
    title: t.meta.disclaimerTitle,
    description: t.meta.disclaimerDescription,
    locale,
    path: "/disclaimer",
    imageAlt: t.meta.ogImageAlt,
  });
}

export default function Disclaimer() {
  const locale = useLocale();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header onDocs />
      <main className="c-root grow flex items-start justify-center py-8">
        <section className="max-w-2xl w-full space-y-6">
          <DisclaimerContent locale={locale} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
