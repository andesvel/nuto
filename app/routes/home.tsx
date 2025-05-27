import React from "react";
import type { Route } from "./+types/home";
import Header from "@components/header";
import Hero from "@components/hero";
import Footer from "@/components/footer";
import { action } from "@/components/shorten";

// eslint-disable-next-line no-empty-pattern
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nuto - An open source URL shortener" },
    {
      name: "description",
      content: "A simple and efficient URL shortening service.",
    },
  ];
}

export { action };

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header />
      <main className="c-root grow flex items-center justify-center">
        <Hero />
      </main>
      <Footer />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"></div>
    </div>
  );
}
