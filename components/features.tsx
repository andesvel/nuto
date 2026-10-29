import React from "react";
import { Link } from "react-router";
import {
  CircleArrowOutUpLeft,
  ExternalLink,
  Shield,
  Timer,
} from "lucide-react";

const FEATURES = [
  {
    icon: CircleArrowOutUpLeft,
    title: "Bypass in-app browsers",
    body: "Automatically detect and break free from frustrating app environments like Instagram or TikTok, launching the user's real browser.",
  },
  {
    icon: ExternalLink,
    title: "Launch native apps",
    body: "Your links open YouTube, Spotify, or Apple Music in their native apps, not in a web view.",
  },
  {
    icon: Shield,
    title: "Secure your links",
    body: "Add an extra layer of privacy by gating your sensitive content behind a custom password.",
  },
  {
    icon: Timer,
    title: "Auto-expiring links",
    body: "Set an expiry date and the link stops redirecting after it passes. Click counts update as visitors arrive.",
  },
];

export function Features() {
  return (
    <section id="features" className="w-full pt-16 pb-14 scroll-mt-20">
      <div className="mx-auto max-w-4xl text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold">Why Nuto</h2>
        <p className="mt-3 text-muted-foreground text-pretty">
          Stop trapping your audience in broken mobile web views. Nuto gets them
          where they actually want to go.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="flex gap-4 rounded-lg border bg-card/40 p-5 backdrop-blur-[2px] transition-colors hover:border-primary/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon aria-hidden className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        Please review the{" "}
        <Link
          to="/disclaimer"
          viewTransition
          className="underline underline-offset-4"
        >
          disclaimer
        </Link>{" "}
        before sharing sensitive content.
      </p>
    </section>
  );
}
