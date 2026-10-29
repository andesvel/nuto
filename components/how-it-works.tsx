import React from "react";
import { useT } from "@/app/i18n";

// The steps really happen in order, so they're numbered; no icons, the
// titles say it.
export function HowItWorks() {
  const t = useT();
  return (
    <section id="how-it-works" className="w-full pt-16 pb-6 scroll-mt-20">
      <div className="mx-auto max-w-3xl text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold">
          {t.howItWorks.title}
        </h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          {t.howItWorks.intro}
        </p>
      </div>
      <ol className="grid gap-8 sm:grid-cols-3">
        {t.howItWorks.steps.map(({ title, body }, i) => (
          <li key={i}>
            <h3 className="flex items-baseline gap-2 font-semibold">
              <span className="text-muted-foreground tabular-nums">
                {i + 1}.
              </span>
              <span>{title}</span>
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
              {body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
