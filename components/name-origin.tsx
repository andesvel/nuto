import React from "react";

export function NameOrigin() {
  return (
    <section id="name" className="w-full  min-h-[30dvh] flex items-center">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">
          What does &quot;Nuto&quot; mean?
        </h2>
        <p className="mt-3 text-muted-foreground">
          It&apos;s short for &quot;diminuto&quot;, the Spanish word for tiny.
          We take your messy URLs and make them{" "}
          <span className="font-semibold">dimi-nuto</span>, so they&apos;re easy
          to share and never break in mobile apps.
        </p>
      </div>
    </section>
  );
}
