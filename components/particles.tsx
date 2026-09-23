import * as React from "react";
import { cn } from "lib/utils";

/**
 * Canvas particle field that scrolls with the page content, adapted from
 * the shadcn.io "Particles" background.
 *
 * The canvas is a fixed viewport-sized layer; particles live in document
 * coordinates and are drawn offset by the scroll position, so they travel
 * with the content while memory stays bounded to one viewport. `quantity`
 * is the density per viewport height, scaled across the whole document.
 *
 * Differences from the reference implementation: theme colors are resolved
 * from the design tokens (logo purple in light, zinc gray in dark) instead
 * of a fixed white, the mouse position is tracked in a ref instead of React
 * state (no re-render per mousemove), the DPR transform is set instead of
 * multiplied, and reduced-motion users get a scroll-aware static field.
 */
interface ParticleProps {
  className?: string;
  /** Number of particles */
  quantity?: number;
  /** Higher values reduce the magnetism pull toward the cursor */
  staticity?: number;
  /** Higher values ease the magnetism movement */
  ease?: number;
  /** Base particle size in pixels */
  size?: number;
  /** Re-randomize the particles when it changes */
  refresh?: boolean;
  /** Explicit particle color; when omitted it follows the theme */
  color?: string;
  vx?: number;
  vy?: number;
}

// The backdrop's theme colors, sampled from the CSS tokens:
// light uses the logo purple (--primary) and dark uses the zinc gray
// the original grid used (--muted-foreground).
const LIGHT_COLOR = "#5a58ff";
const DARK_COLOR = "#a1a1aa";

function hexToRgb(hex: string): number[] {
  let normalized = hex.replace("#", "");

  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hexInt = Number.parseInt(normalized, 16);
  return [(hexInt >> 16) & 255, (hexInt >> 8) & 255, hexInt & 255];
}

interface Circle {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
}

function remapValue(
  value: number,
  start1: number,
  end1: number,
  start2: number,
  end2: number
): number {
  const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
  return remapped > 0 ? remapped : 0;
}

export function Particles({
  className,
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color,
  vx = 0,
  vy = 0,
}: ParticleProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const circlesRef = React.useRef<Circle[]>([]);
  const mouseRef = React.useRef({ x: 0, y: 0 });
  const canvasSizeRef = React.useRef({ w: 0, h: 0 });
  const pageHeightRef = React.useRef(0);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  const [resolvedColor, setResolvedColor] = React.useState(
    color ?? LIGHT_COLOR
  );

  React.useEffect(() => {
    if (color) {
      setResolvedColor(color);
      return;
    }
    const sync = () => {
      setResolvedColor(
        document.documentElement.classList.contains("dark")
          ? DARK_COLOR
          : LIGHT_COLOR
      );
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [color]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const rgb = hexToRgb(resolvedColor);
    let raf = 0;

    const resizeCanvas = () => {
      circlesRef.current.length = 0;
      canvasSizeRef.current.w = container.offsetWidth;
      canvasSizeRef.current.h = container.offsetHeight;
      pageHeightRef.current = document.documentElement.scrollHeight;
      canvas.width = canvasSizeRef.current.w * dpr;
      canvas.height = canvasSizeRef.current.h * dpr;
      canvas.style.width = `${canvasSizeRef.current.w}px`;
      canvas.style.height = `${canvasSizeRef.current.h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // The prop is a density per viewport; a taller document gets more
    // particles so the field looks the same at every scroll position.
    const totalParticles = () => {
      const screens = Math.max(1, pageHeightRef.current / canvasSizeRef.current.h);
      return Math.round(quantity * screens);
    };

    const circleParams = (): Circle => ({
      x: Math.floor(Math.random() * canvasSizeRef.current.w),
      y: Math.floor(Math.random() * pageHeightRef.current),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: Number.parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    });

    // Respawns land inside the current viewport band so density follows the
    // user instead of thinning out over time.
    const spawnInView = (): Circle => {
      const circle = circleParams();
      circle.y = Math.floor(window.scrollY + Math.random() * canvasSizeRef.current.h);
      return circle;
    };

    const drawCircle = (circle: Circle, drawY: number, update = false) => {
      const { x, translateX, translateY, size, alpha } = circle;
      context.translate(translateX, translateY);
      context.beginPath();
      context.arc(x, drawY, size, 0, 2 * Math.PI);
      context.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.fill();
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circlesRef.current.push(circle);
      }
    };

    const clearContext = () => {
      context.clearRect(0, 0, canvasSizeRef.current.w, canvasSizeRef.current.h);
    };

    const spawnParticles = (opaque = false) => {
      clearContext();
      const scrollY = window.scrollY;
      const { h } = canvasSizeRef.current;
      for (let i = 0; i < totalParticles(); i++) {
        const circle = circleParams();
        if (opaque) circle.alpha = circle.targetAlpha;
        circlesRef.current.push(circle);
        const vy = circle.y - scrollY;
        if (vy >= -circle.size && vy <= h + circle.size) {
          drawCircle(circle, vy, true);
        }
      }
    };

    const drawStatic = () => {
      clearContext();
      const scrollY = window.scrollY;
      const { h } = canvasSizeRef.current;
      for (const circle of circlesRef.current) {
        const vy = circle.y - scrollY;
        if (vy < -circle.size || vy > h + circle.size) continue;
        circle.alpha = circle.targetAlpha;
        drawCircle(circle, vy, true);
      }
    };

    const animate = () => {
      clearContext();
      const scrollY = window.scrollY;
      const { w, h } = canvasSizeRef.current;
      const pageH = pageHeightRef.current;
      circlesRef.current.forEach((circle, index) => {
        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX +=
          (mouseRef.current.x / (staticity / circle.magnetism) -
            circle.translateX) /
          ease;
        circle.translateY +=
          (mouseRef.current.y / (staticity / circle.magnetism) -
            circle.translateY) /
          ease;

        // Wrap only at the document edges; particles between viewports
        // simply wait offscreen until they scroll back into view.
        if (
          circle.x < -circle.size ||
          circle.x > w + circle.size ||
          circle.y < -circle.size ||
          circle.y > pageH + circle.size
        ) {
          circlesRef.current.splice(index, 1);
          const fresh = spawnInView();
          drawCircle(fresh, fresh.y - scrollY);
          return;
        }

        const drawY = circle.y - scrollY;
        if (drawY < -circle.size || drawY > h + circle.size) return;

        // Fade relative to the visible screen so particles enter and leave
        // smoothly while scrolling.
        const edge = [
          circle.x + circle.translateX - circle.size,
          w - circle.x - circle.translateX - circle.size,
          drawY + circle.translateY - circle.size,
          h - drawY - circle.translateY - circle.size,
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosestEdge = Number.parseFloat(
          remapValue(closestEdge, 0, 20, 0, 1).toFixed(2)
        );
        if (remapClosestEdge > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) {
            circle.alpha = circle.targetAlpha;
          }
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }

        drawCircle(circle, drawY, true);
      });
      raf = window.requestAnimationFrame(animate);
    };

    const initCanvas = () => {
      resizeCanvas();
      spawnParticles();
    };

    const handleMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const { w, h } = canvasSizeRef.current;
      const x = event.clientX - rect.left - w / 2;
      const y = event.clientY - rect.top - h / 2;
      if (x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2) {
        mouseRef.current = { x, y };
      }
    };

    const handleLeave = () => {
      mouseRef.current = { x: 0, y: 0 };
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    resizeCanvas();
    spawnParticles(reducedMotion);
    if (reducedMotion) {
      // No drift or magnetism, but the field still tracks scroll so it
      // moves with the content like everywhere else.
      window.addEventListener("scroll", drawStatic, { passive: true });
    } else {
      raf = window.requestAnimationFrame(animate);
    }
    window.addEventListener("resize", initCanvas);
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);

    // Document height changes (content loading, viewport resizing) re-lay
    // the particle field.
    const docObserver = new ResizeObserver(() => {
      if (document.documentElement.scrollHeight === pageHeightRef.current) {
        return;
      }
      initCanvas();
    });
    docObserver.observe(document.documentElement);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", initCanvas);
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("scroll", drawStatic);
      docObserver.disconnect();
    };
  }, [resolvedColor, refresh, quantity, size, staticity, ease, vx, vy, dpr]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
