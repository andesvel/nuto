import * as React from "react";
import type { Route } from "./+types/privacy";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PrivacyContent } from "@/components/legal/privacy";
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
    title: t.meta.privacyTitle,
    description: t.meta.privacyDescription,
    locale,
    path: "/privacy",
    imageAlt: t.meta.ogImageAlt,
  });
}

export default function TermsOfService() {
  const locale = useLocale();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header onDocs />
      <main className="c-root grow flex items-start justify-center py-8">
        <section className="max-w-2xl w-full space-y-6">
          <PrivacyContent locale={locale} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
