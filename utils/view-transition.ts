import { flushSync } from "react-dom";

/**
 * Runs a state update inside a view transition when the browser supports
 * it and the user hasn't asked for reduced motion; otherwise just updates.
 * flushSync makes React commit inside the transition's update callback, so
 * the "new" snapshot is the updated DOM.
 */
export function withViewTransition(update: () => void): void {
  if (
    typeof document === "undefined" ||
    !document.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

/** view-transition-name for an element tied to a short link. */
export function linkTransitionName(shortCode: string): string {
  // Must be a valid CSS <custom-ident>; legacy codes may contain other chars
  return `link-${shortCode.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
