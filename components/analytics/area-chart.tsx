import * as React from "react";
import { niceMax, type SeriesPoint } from "@/utils/analytics-series";

const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 36 };

/**
 * Clicks over time: an area under a line that draws itself in, with a
 * pointer/keyboard readout. A visually hidden table carries the same data
 * for screen readers.
 */
export function AreaChart({
  points,
  label,
  formatDate,
  formatValue,
  caption,
}: {
  points: SeriesPoint[];
  label: string;
  formatDate: (date: Date) => string;
  formatValue: (n: number) => string;
  caption: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(640);
  const [active, setActive] = React.useState<number | null>(null);
  const gradientId = React.useId();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = niceMax(Math.max(0, ...points.map((p) => p.clicks)));
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)} ${y(p.clicks)}`).join("");
  const area = points.length
    ? `${line}L${x(points.length - 1)} ${PAD.top + innerH}L${x(0)} ${PAD.top + innerH}Z`
    : "";
  const ticks = [0, max / 2, max];
  // One date label per ~90px, so they never collide on narrow screens
  const labels = Math.max(2, Math.min(6, Math.floor(innerW / 90)));
  const every = Math.max(1, Math.ceil(points.length / labels));

  const pick = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const ratio = (clientX - rect.left - PAD.left) / innerW;
    setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };

  const current = active !== null ? points[active] : null;

  return (
    <div ref={ref} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={label}
        tabIndex={0}
        className="block max-w-full outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        onPointerMove={(e) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setActive((i) => {
            const base = i ?? points.length - 1;
            const next = base + (e.key === "ArrowRight" ? 1 : -1);
            return Math.min(points.length - 1, Math.max(0, next));
          });
        }}
        onBlur={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeDasharray={tick === 0 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {formatValue(tick)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          // The last label replaces a regular one that would sit too close
          (i % every === 0 && points.length - 1 - i >= every / 2) ||
          i === points.length - 1 ? (
            <text
              key={p.key}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[11px]"
            >
              {formatDate(p.date)}
            </text>
          ) : null,
        )}
        <path d={area} fill={`url(#${gradientId})`} className="chart-fade" />
        <path
          d={line}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          className="chart-draw"
        />
        {current && active !== null && (
          <g>
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--muted-foreground)"
              strokeOpacity={0.4}
            />
            <circle
              cx={x(active)}
              cy={y(current.clicks)}
              r={4}
              fill="var(--background)"
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>
      {current && active !== null && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute top-0 rounded-md border bg-popover px-2 py-1 text-xs shadow-sm"
          style={{
            left: Math.min(width - 120, Math.max(0, x(active) - 60)),
          }}
        >
          <span className="text-muted-foreground">{formatDate(current.date)}</span>{" "}
          <span key={current.clicks} className="font-medium tabular-nums">
            {formatValue(current.clicks)}
          </span>
        </div>
      )}
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{formatDate(p.date)}</th>
              <td>{p.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
