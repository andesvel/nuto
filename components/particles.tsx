import * as React from "react";
import { cn } from "lib/utils";

/**
 * Canvas particle field, adapted from the shadcn.io "Particles" background.
 *
 * Differences from the reference implementation: theme colors are resolved
 * from the design tokens (logo purple in light, zinc gray in dark) instead
 * of a fixed white, the mouse position is tracked in a ref instead of React
 * state (no re-render per mousemove), the DPR transform is set instead of
 * multiplied, and reduced-motion users get a single static frame.
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
      canvas.width = canvasSizeRef.current.w * dpr;
      canvas.height = canvasSizeRef.current.h * dpr;
      canvas.style.width = `${canvasSizeRef.current.w}px`;
      canvas.style.height = `${canvasSizeRef.current.h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const circleParams = (): Circle => ({
      x: Math.floor(Math.random() * canvasSizeRef.current.w),
      y: Math.floor(Math.random() * canvasSizeRef.current.h),
      translateX: 0,
      translateY: 0,
      size: Math.floor(Math.random() * 2) + size,
      alpha: 0,
      targetAlpha: Number.parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    });

    const drawCircle = (circle: Circle, update = false) => {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.translate(translateX, translateY);
      context.beginPath();
      context.arc(x, y, size, 0, 2 * Math.PI);
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

    const drawParticles = (opaque = false) => {
      clearContext();
      for (let i = 0; i < quantity; i++) {
        const circle = circleParams();
        if (opaque) circle.alpha = circle.targetAlpha;
        drawCircle(circle);
      }
    };

    const animate = () => {
      clearContext();
      circlesRef.current.forEach((circle, index) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSizeRef.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSizeRef.current.h - circle.y - circle.translateY - circle.size,
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

        drawCircle(circle, true);

        if (
          circle.x < -circle.size ||
          circle.x > canvasSizeRef.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSizeRef.current.h + circle.size
        ) {
          circlesRef.current.splice(index, 1);
          drawCircle(circleParams());
        }
      });
      raf = window.requestAnimationFrame(animate);
    };

    const initCanvas = () => {
      resizeCanvas();
      drawParticles();
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
    if (reducedMotion) {
      drawParticles(true);
    } else {
      drawParticles();
      raf = window.requestAnimationFrame(animate);
    }
    window.addEventListener("resize", initCanvas);
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", initCanvas);
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
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
