import React from "react";
import Shorten from "@components/shorten";

export default function Hero() {
  return (
    <section className="w-full grow -mt-52">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Short links with <span className="text-primary">ease</span>
        </h1>
        <p className="mb-10 text-lg text-muted-foreground md:text-xl">
          Nuto transforms your long URLs into concise, memorable links.
        </p>
      </div>
      <Shorten />
    </section>
  );
}
