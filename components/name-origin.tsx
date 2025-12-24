import React from "react";

export function NameOrigin() {
  return (
    <section id="name" className="w-full  min-h-[30dvh] flex items-center">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">
          What does &quot;Nuto&quot; mean?
        </h2>
        <p className="mt-3 text-muted-foreground">
          &quot;Nuto&quot; comes from the Spanish word &quot;diminuto&quot;
          (tiny). Because it&apos;s a URL shortener, your long link becomes{" "}
          <span className="font-semibold">dimi-nuto</span>, the short part is{" "}
          <span className="font-semibold">nuto</span>. A nod to making links
          tiny and opening them in the right place.
        </p>
      </div>
    </section>
  );
}
