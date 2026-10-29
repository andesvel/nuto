import React from "react";
import { AppWindow, Link2, Send } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    title: "Shorten your link",
    body: "Paste a YouTube, Spotify or any other URL. Pick a custom short code or let Nuto generate one.",
  },
  {
    icon: Send,
    title: "Share it anywhere",
    body: "Put it in your Instagram bio, a TikTok comment or a story. It's short and easy to remember.",
  },
  {
    icon: AppWindow,
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
          them where they can actually listen, watch or buy.
        </p>
      </div>
      <ol className="grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="relative flex flex-col gap-3 p-1">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                Step {i + 1}
              </span>
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground text-pretty">{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
