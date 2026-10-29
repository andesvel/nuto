import React from "react";
import { GetStartedButton } from "./get-started-button";
import { useT } from "@/app/i18n";

export function CtaSection() {
  const t = useT();
  return (
    <section id="cta" className="w-full py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">{t.cta.title}</h2>
        <p className="mt-3 mb-8 text-muted-foreground text-pretty">
          {t.cta.body}
        </p>
        <div className="flex justify-center gap-4">
          <GetStartedButton />
        </div>
      </div>
    </section>
  );
}
