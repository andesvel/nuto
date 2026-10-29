import React from "react";
import { ChevronDown } from "lucide-react";

// Shared with the landing's FAQPage JSON-LD, so the structured data always
// matches what visitors can read on the page.
export const FAQ_ITEMS = [
  {
    question: "What is an in-app browser?",
    answer:
      "It's the built-in web view that apps like Instagram, TikTok and Facebook use when you tap a link. You aren't signed in to anything there, and links to YouTube or Spotify play in a cramped page instead of the app.",
  },
  {
    question: "How does Nuto open links in the native app?",
    answer:
      "Nuto checks where the link was tapped. Inside an in-app browser on iOS it opens Safari, and YouTube and Spotify links go straight to their apps. On Android it hands the link to the system, which opens the default browser or the matching app. Regular browsers get a normal redirect.",
  },
  {
    question: "Is Nuto free?",
    answer:
      "Yes. Nuto is a free, non-commercial project. You only need a free account to create links, and each account has a link limit.",
  },
  {
    question: "Can I protect a link with a password?",
    answer:
      "Yes. Visitors have to enter the password before they're redirected. It's stored hashed with a salt, never in plain text, and repeated wrong attempts are rate limited.",
  },
  {
    question: "Can a link expire?",
    answer:
      "Yes. Set an expiry date and time when you create or edit a link. After it passes, the link stops redirecting and shows that it has expired.",
  },
  {
    question: "What does Nuto record when someone clicks a link?",
    answer:
      "Only the time, the visitor's country and their browser's user agent, so you can see click counts. Nuto never stores IP addresses.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="w-full py-16 scroll-mt-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y rounded-lg border bg-background">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <details key={question} className="group px-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                <h3>{question}</h3>
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="pb-4 text-sm text-muted-foreground text-pretty">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
