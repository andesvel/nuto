import React from "react";
import { Link } from "react-router";
import {
  CircleArrowOutUpLeft,
  ExternalLink,
  Shield,
  Timer,
} from "lucide-react";

export function Features() {
  return (
    <section id="features" className="w-full pt-16 pb-14">
      <div className="mx-auto max-w-4xl text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold">Why Nuto</h2>
        <p className="mt-3 text-muted-foreground">
          Built to route users out of in-app browsers and into the right place:
          the native browser or the right native app.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <CircleArrowOutUpLeft className="h-5 w-5" /> Escape in-app browsers
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Nuto detects in-app contexts and rewrites the destination to open in
            the native browser, powered by smart user-agent handling.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <ExternalLink className="h-5 w-5" /> Open in native apps
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Deep-links into apps like YouTube, Spotify and Apple Music.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5" /> Password-protected links
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Gate sensitive links with a password before redirecting.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Timer className="h-5 w-5" /> Expiration & click insights
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Set expiry for temporary shares and track basic click metrics.
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        Please review the{" "}
        <Link to="/disclaimer" className="underline underline-offset-4">
          disclaimer
        </Link>{" "}
        before sharing sensitive content.
      </p>
    </section>
  );
}
