import React from "react";
import { GetStartedButton } from "./get-started-button";

export function CtaSection() {
  return (
    <section id="cta" className="w-full py-16">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card/40 px-6 py-12 text-center backdrop-blur-[2px]">
        <h2 className="text-2xl sm:text-3xl font-bold">Ready to begin?</h2>
        <p className="mt-3 mb-8 text-muted-foreground text-pretty">
          Create a free account and start shortening links that open in the
          right place.
        </p>
        <div className="flex justify-center gap-4">
          <GetStartedButton />
        </div>
      </div>
    </section>
  );
}
