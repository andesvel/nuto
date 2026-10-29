import React from "react";

// These really happen in order, so they're numbered; no icons, the titles
// say it.
const STEPS = [
  {
    title: "Shorten your link",
    body: "Paste a YouTube, Spotify or any other URL. Pick a custom short code or let Nuto generate one.",
  },
  {
    title: "Share it anywhere",
    body: "Put it in your Instagram bio, a TikTok comment or a story.",
  },
  {
    title: "It opens in the right app",
    body: "When someone taps it inside an app, Nuto skips the in-app browser and opens their real browser or the native app.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full pt-16 pb-6 scroll-mt-20">
      <div className="mx-auto max-w-3xl text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          Instagram, TikTok and Facebook open links in a cramped built-in
          browser where people aren&apos;t signed in to anything. Nuto sends
          them to the app or browser they already use.
        </p>
      </div>
      <ol className="grid gap-8 sm:grid-cols-3">
        {STEPS.map(({ title, body }, i) => (
          <li key={title}>
            <h3 className="flex items-baseline gap-2 font-semibold">
              <span className="text-muted-foreground tabular-nums">
                {i + 1}.
              </span>
              {title}
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
