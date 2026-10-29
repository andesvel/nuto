import * as React from "react";

/** Clicks per local hour of day as 24 bars that rise in on mount. */
export function HourChart({
  values,
  label,
  caption,
  formatValue,
}: {
  values: number[];
  label: string;
  caption: string;
  formatValue: (n: number) => string;
}) {
  const max = Math.max(1, ...values);
  const peak = values.indexOf(Math.max(...values));
  return (
    <div>
      <div role="img" aria-label={label} className="flex h-28 items-end gap-[3px]">
        {values.map((value, hour) => (
          <div
            key={hour}
            title={`${String(hour).padStart(2, "0")}:00 · ${formatValue(value)}`}
            className="chart-grow-y flex-1 rounded-t-sm"
            style={{
              height: `${Math.max(2, (value / max) * 100)}%`,
              background:
                value > 0 && hour === peak ? "var(--chart-1)" : "var(--chart-3)",
              opacity: value > 0 ? 1 : 0.35,
              animationDelay: `${hour * 15}ms`,
            }}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="mt-1 flex justify-between text-[11px] text-muted-foreground tabular-nums"
      >
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {values.map((value, hour) => (
            <tr key={hour}>
              <th scope="row">{`${String(hour).padStart(2, "0")}:00`}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
