import * as React from "react";

/**
 * Full-viewport decorative grid backdrop.
 *
 * Rendered `fixed` so it covers the whole page during scroll and never
 * repaints for it. Pure decoration: hidden from a11y tree, ignores pointer
 * events, and stays perfectly still unless motion is requested and allowed
 * (see the parallax effect for the enhanced behavior).
 */
export function GridBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"
    />
  );
}
