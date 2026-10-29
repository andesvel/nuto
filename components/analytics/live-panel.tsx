import * as React from "react";
import { QrCode } from "lucide-react";
import { LOCALE_TAGS, useFormatNumber, useLocale, useT } from "@/app/i18n";
import type { LiveClick } from "@/app/repository/analytics";
import { appLabel, countryLabel, deviceLabel } from "./labels";

const POLL_MS = 15_000;

interface LiveData {
  perMinute: { key: string; clicks: number }[];
  recent: LiveClick[];
  to: string;
}

function useLiveActivity(link: string | null): LiveData | null {
  const [data, setData] = React.useState<LiveData | null>(null);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const url = `/api/analytics/live${link ? `?link=${encodeURIComponent(link)}` : ""}`;

    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch(url, { headers: { Accept: "application/json" } });
          if (response.ok && !stopped) setData(await response.json());
        } catch {
          // Offline or a deploy in progress: try again next tick
        }
      }
      if (!stopped) timer = setTimeout(load, POLL_MS);
    };
    // Coming back to the tab refreshes right away instead of waiting
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      load();
    };

    load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [link]);

  return data;
}

/** Last hour, refreshed every 15 s while the tab is visible. */
export function LivePanel({ link }: { link: string | null }) {
  const t = useT();
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const data = useLiveActivity(link);

  // 60 one-minute slots ending now
  const minutes = React.useMemo(() => {
    const slots = new Array<number>(60).fill(0);
    if (!data) return slots;
    const end = Date.parse(data.to);
    for (const { key, clicks } of data.perMinute) {
      const age = Math.floor((end - Date.parse(`${key}:00Z`)) / 60_000);
      if (age >= 0 && age < 60) slots[59 - age] += clicks;
    }
    return slots;
  }, [data]);
  const total = minutes.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...minutes);
  const relative = React.useMemo(
    () => new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" }),
    [locale],
  );

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
      <div>
        <p key={total} className="text-sm text-muted-foreground">
          {t.analytics.live.lastHour(t.analytics.clicksCount(formatNumber(total), total))}
        </p>
        <div aria-hidden className="mt-3 flex h-16 items-end gap-px">
          {minutes.map((value, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-[1px] transition-[height] duration-500 motion-reduce:transition-none"
              style={{
                height: `${Math.max(3, (value / max) * 100)}%`,
                background: value ? "var(--chart-1)" : "var(--chart-4)",
              }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t.analytics.live.updated}</p>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium">{t.analytics.live.recent}</h3>
        {data && data.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.analytics.live.none}</p>
        ) : (
          <ul className="grid gap-1 text-sm" aria-live="polite">
            {(data?.recent ?? []).map((click) => {
              const seconds = Math.round(
                (Date.parse(click.clickedAt) - Date.parse(data!.to)) / 1000,
              );
              const ago =
                Math.abs(seconds) < 60
                  ? relative.format(seconds, "second")
                  : relative.format(Math.round(seconds / 60), "minute");
              return (
                <li
                  key={`${click.shortCode}-${click.clickedAt}`}
                  className="chart-enter flex items-center justify-between gap-3 rounded-sm px-2 py-1 odd:bg-muted/50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span translate="no" className="truncate font-mono text-xs font-semibold">
                      /{click.shortCode}
                    </span>
                    {click.source === "qr" && (
                      <QrCode
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-label={t.analytics.live.qr}
                      />
                    )}
                    <span className="truncate text-xs text-muted-foreground">
                      {appLabel(click.app, t)} · {deviceLabel(click.device, t)} ·{" "}
                      {countryLabel(click.country, locale, t)}
                    </span>
                  </span>
                  <span key={ago} className="shrink-0 text-xs text-muted-foreground">
                    {ago}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
