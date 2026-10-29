import React from "react";
import { ChevronDown } from "lucide-react";
import { useT } from "@/app/i18n";

// The same items feed the landing's FAQPage JSON-LD, so the structured
// data always matches what visitors can read.
export function Faq() {
  const t = useT();
  return (
    <section id="faq" className="w-full py-16 scroll-mt-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center">
          {t.faq.title}
        </h2>
        <div className="mt-8 divide-y rounded-lg border bg-background">
          {t.faq.items.map(({ question, answer }) => (
            <details key={question} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                <h3>{question}</h3>
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="pb-4 text-sm text-muted-foreground text-pretty">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
