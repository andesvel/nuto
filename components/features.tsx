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
          Stop trapping your audience in broken mobile web views. Nuto gets them
          where they actually want to go.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <CircleArrowOutUpLeft className="h-5 w-5" /> Bypass in-app browsers
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Automatically detect and break free from frustrating app environments
            like Instagram or TikTok, launching the user&apos;s real browser.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <ExternalLink className="h-5 w-5" /> Launch native apps
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Seamlessly deep-link your visitors straight into the apps they already
            have installed, like YouTube, Spotify, or Apple Music.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5" /> Secure your links
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Add an extra layer of privacy by gating your sensitive content behind
            a custom password.
          </p>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-2 font-semibold">
            <Timer className="h-5 w-5" /> Auto-expiring links
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Create temporary links that self-destruct after a set time, and seamlessly track
            how many clicks you&apos;re getting.
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
