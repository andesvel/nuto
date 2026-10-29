import React from "react";
import { Link } from "react-router";
import {
  CircleArrowOutUpLeft,
  ExternalLink,
  Shield,
  Timer,
} from "lucide-react";
import { localizedPath, useLocale, useT } from "@/app/i18n";

const ICONS = {
  bypass: CircleArrowOutUpLeft,
  native: ExternalLink,
  password: Shield,
  expiry: Timer,
};

export function Features() {
  const t = useT();
  const locale = useLocale();
  return (
    <section id="features" className="w-full pt-16 pb-14 scroll-mt-20">
      <h2 className="mb-10 text-center text-2xl sm:text-3xl font-bold">
        {t.features.title}
      </h2>
      <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((key) => {
          const Icon = ICONS[key];
          const { title, body } = t.features.items[key];
          return (
            <li key={key}>
              <h3 className="flex items-center gap-2 font-semibold">
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                <span>{title}</span>
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                {body}
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        {t.features.disclaimerBefore}{" "}
        <Link
          to={localizedPath(locale, "/disclaimer")}
          viewTransition
          className="underline underline-offset-4"
        >
          {t.features.disclaimerLink}
        </Link>{" "}
        {t.features.disclaimerAfter}
      </p>
    </section>
  );
}
