import * as React from "react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { installTranslatorGuard } from "@/utils/translator-guard";

// Before hydration, so a page translated early can't crash React
installTranslatorGuard();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
