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
    body: "Taps from Instagram, TikTok or Facebook leave the built-in browser and open in Safari or the phone's default browser.",
  },
  {
    icon: ExternalLink,
    title: "Launch native apps",
    body: "On iOS, YouTube and Spotify links open straight in their apps. On Android, the system hands the link to the app that handles it.",
  },
  {
    icon: Shield,
    title: "Password-protected links",
    body: "Visitors type a password before they're redirected. It's stored hashed, and repeated wrong guesses are rate limited.",
  },
  {
    icon: Timer,
    title: "Expiring links",
    body: "Pick a date and time; after it, the link stops redirecting. The dashboard shows clicks and the last visit for each link.",
  },
];

export function Features() {
  return (
    <section id="features" className="w-full pt-16 pb-14 scroll-mt-20">
      <h2 className="mb-10 text-center text-2xl sm:text-3xl font-bold">
        Why Nuto
      </h2>
      <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <h3 className="flex items-center gap-2 font-semibold">
              <Icon aria-hidden className="size-4 text-muted-foreground" />
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
              {body}
            </p>
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
