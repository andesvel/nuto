import * as React from "react";

const MAX_SHIFT = 10;
const LERP = 0.08;
const SETTLE = 0.05;

/**
 * Full-viewport decorative dot-matrix backdrop.
 *
 * Rendered `fixed` so it covers the whole page during scroll and never
 * repaints for it. Pure decoration: hidden from a11y tree and ignores pointer
 * events.
 *
 * On devices with a fine pointer and no reduced-motion preference, the dots
 * drift a few pixels opposite the cursor for a subtle depth effect. The
 * motion is CSS `background-position` on a repeating pattern, driven by an
 * rAF loop that lerps toward the target and stops once settled, so nothing
 * burns frames while idle.
 */
export function DotMatrix() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window.matchMedia !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reducedMotion.matches || !finePointer.matches) return;

    let raf = 0;
    let running = false;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const frame = () => {
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;

      if (
        Math.abs(targetX - currentX) <= SETTLE &&
        Math.abs(targetY - currentY) <= SETTLE
      ) {
        currentX = targetX;
        currentY = targetY;
        running = false;
      } else {
        raf = requestAnimationFrame(frame);
      }

      el.style.backgroundPosition = `${currentX.toFixed(2)}px ${currentY.toFixed(2)}px`;
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    const handleMove = (event: PointerEvent) => {
      if (reducedMotion.matches) return;

      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;

      // Opposite the cursor: the backdrop reads as the far layer.
      targetX = nx * MAX_SHIFT * -1;
      targetY = ny * MAX_SHIFT * -1;
      wake();
    };

    const handleLeave = () => {
      targetX = 0;
      targetY = 0;
      wake();
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    window.addEventListener("blur", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("blur", handleLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle,rgba(from_var(--muted-foreground)_r_g_b_/_0.05)_1px,transparent_1px)] bg-[size:1lh_1lh]"
    />
  );
}
