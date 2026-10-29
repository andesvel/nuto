import React from "react";
import { useT } from "@/app/i18n";

export function NameOrigin() {
  const t = useT();
  return (
    <section id="name" className="w-full  min-h-[30dvh] flex items-center">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl sm:text-3xl font-bold">{t.nameOrigin.title}</h2>
        <p className="mt-3 text-muted-foreground">
          {t.nameOrigin.bodyStart}{" "}
          <span translate="no" className="font-semibold">
            dimi-nuto
          </span>
          , {t.nameOrigin.bodyEnd}
        </p>
      </div>
    </section>
  );
}
