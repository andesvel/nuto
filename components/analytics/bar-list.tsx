import * as React from "react";
import { Link } from "react-router";

export interface BarItem {
  key: string;
  label: React.ReactNode;
  value: number;
  /** Optional link (e.g. filter analytics to this link) */
  to?: string;
  /** Keep labels like short codes out of machine translation */
  noTranslate?: boolean;
}

/** Ranked horizontal bars that grow in on mount. */
export function BarList({
  items,
  formatValue,
  emptyLabel,
}: {
  items: BarItem[];
  formatValue: (n: number) => string;
  emptyLabel: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="grid gap-1.5">
      {items.map((item, index) => {
        const content = (
          <>
            <span
              aria-hidden
              className="chart-grow-x absolute inset-y-0 left-0 rounded-sm bg-[var(--chart-1)]/15"
              style={{
                width: `${(item.value / max) * 100}%`,
                animationDelay: `${index * 40}ms`,
              }}
            />
            <span
              className="relative truncate"
              translate={item.noTranslate ? "no" : undefined}
            >
              {item.label}
            </span>
            <span key={item.value} className="relative tabular-nums text-muted-foreground">
              {formatValue(item.value)}
            </span>
          </>
        );
        const className =
          "relative flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm";
        return (
          <li key={item.key}>
            {item.to ? (
              <Link
                to={item.to}
                className={`${className} hover:bg-accent transition-colors`}
              >
                {content}
              </Link>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
