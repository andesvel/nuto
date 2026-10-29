// Client-side shaping of the analytics payload: the server counts in UTC,
// the charts speak the viewer's time zone. `offsetMinutes` follows
// Date#getTimezoneOffset (minutes to add to local time to get UTC) and is a
// parameter so tests don't depend on the machine's zone.

export interface SeriesPoint {
  /** Local day ("YYYY-MM-DD") or week start, used as a stable key */
  key: string;
  /** Midday of that local day, as an instant, for formatting */
  date: Date;
  clicks: number;
}

const DAY = 86_400_000;
// Beyond this many days a daily line turns to noise; group by week
const MAX_DAILY_POINTS = 120;

function localDayKey(instant: number, offsetMinutes: number): string {
  return new Date(instant - offsetMinutes * 60_000).toISOString().slice(0, 10);
}

function bucketInstant(key: string): number {
  // "YYYY-MM-DDTHH" (hourly) or "YYYY-MM-DD" (daily), both UTC
  return Date.parse(key.length > 10 ? `${key}:00:00Z` : `${key}T00:00:00Z`);
}

/**
 * Zero-filled clicks per local day between `from` (or the first bucket) and
 * `to`, grouped by week when the span is long.
 */
export function clicksByLocalDay(
  buckets: { key: string; clicks: number }[],
  { from, to, offsetMinutes }: { from: string | null; to: string; offsetMinutes: number },
): SeriesPoint[] {
  const totals = new Map<string, number>();
  for (const { key, clicks } of buckets) {
    const day = key.length > 10 ? localDayKey(bucketInstant(key), offsetMinutes) : key;
    totals.set(day, (totals.get(day) ?? 0) + clicks);
  }

  const endDay = localDayKey(Date.parse(to), offsetMinutes);
  const firstBucket = [...totals.keys()].sort()[0];
  const startDay = from
    ? localDayKey(Date.parse(from), offsetMinutes)
    : (firstBucket ?? endDay);

  const days: SeriesPoint[] = [];
  for (
    let t = Date.parse(`${startDay}T12:00:00Z`);
    t <= Date.parse(`${endDay}T12:00:00Z`);
    t += DAY
  ) {
    const key = new Date(t).toISOString().slice(0, 10);
    days.push({ key, date: new Date(t + offsetMinutes * 60_000), clicks: totals.get(key) ?? 0 });
  }

  if (days.length <= MAX_DAILY_POINTS) return days;
  const weeks: SeriesPoint[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({
      key: chunk[0].key,
      date: chunk[0].date,
      clicks: chunk.reduce((n, d) => n + d.clicks, 0),
    });
  }
  return weeks;
}

/** Clicks per local hour of day (index 0-23) from UTC hour buckets. */
export function clicksByLocalHour(
  hours: { key: string; clicks: number }[],
  offsetMinutes: number,
): number[] {
  const result = new Array<number>(24).fill(0);
  const shift = Math.round(-offsetMinutes / 60);
  for (const { key, clicks } of hours) {
    const local = (((Number(key) + shift) % 24) + 24) % 24;
    result[local] += clicks;
  }
  return result;
}

/** Signed percentage change, or null when there's nothing to compare to. */
export function percentChange(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Round up to a readable axis maximum (1, 2, 5 × 10^n). */
export function niceMax(value: number): number {
  if (value <= 4) return Math.max(1, Math.ceil(value));
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}
