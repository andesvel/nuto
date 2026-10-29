/**
 * Dashboard analytics, aggregated in D1 for one user's links. Every query
 * is bounded by the user's links and the selected time range, and they run
 * in one batch. clicked_at uses SQLite's "YYYY-MM-DD HH:MM:SS" (UTC), so
 * range bounds are passed in that format.
 */

export const ANALYTICS_RANGES = ["7d", "30d", "90d", "all"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

const RANGE_DAYS: Record<Exclude<AnalyticsRange, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function isAnalyticsRange(value: unknown): value is AnalyticsRange {
  return (
    typeof value === "string" &&
    (ANALYTICS_RANGES as readonly string[]).includes(value)
  );
}

export interface Breakdown<K extends string | null = string | null> {
  key: K;
  clicks: number;
}

export interface AnalyticsData {
  range: AnalyticsRange;
  /** ISO start of the range (null for all time) and end */
  from: string | null;
  to: string;
  totals: {
    clicks: number;
    /** Clicks in the equally long period before, null for all time */
    previousClicks: number | null;
    activeLinks: number;
    linksCreated: number;
    qrScans: number;
  };
  /**
   * Sparse click counts: hourly buckets ("YYYY-MM-DDTHH", UTC) for bounded
   * ranges so the client can regroup them by its own time zone, daily ones
   * ("YYYY-MM-DD", UTC) for all time.
   */
  series: { granularity: "hour" | "day"; buckets: Breakdown<string>[] };
  /** Clicks per UTC hour of day (0-23) */
  hours: Breakdown<string>[];
  topLinks: Breakdown<string>[];
  countries: Breakdown[];
  /** In-app browser key, null for a regular browser */
  apps: Breakdown[];
  devices: Breakdown[];
}

/** SQLite datetime() text for a Date */
export function sqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

const TOP_LIMIT = 10;

export async function getAnalytics(
  db: D1Database,
  {
    userId,
    range,
    link = null,
    now = new Date(),
  }: {
    userId: string;
    range: AnalyticsRange;
    link?: string | null;
    now?: Date;
  },
): Promise<AnalyticsData> {
  const days = range === "all" ? null : RANGE_DAYS[range];
  const fromDate = days ? new Date(now.getTime() - days * 86_400_000) : null;
  const prevDate = days ? new Date(now.getTime() - 2 * days * 86_400_000) : null;
  const from = fromDate ? sqlDateTime(fromDate) : "0000-01-01 00:00:00";
  const to = sqlDateTime(now);

  // ?1 user, ?2 from, ?3 to, ?4 link filter (or null)
  const scope = `FROM clicks c JOIN urls u ON u.id = c.url_id
    WHERE u.user_id = ?1 AND c.clicked_at >= ?2 AND c.clicked_at <= ?3
      AND (?4 IS NULL OR c.url_id = ?4)`;
  const bucket = days ? "strftime('%Y-%m-%dT%H', c.clicked_at)" : "date(c.clicked_at)";
  const grouped = (key: string, extra = "") =>
    db
      .prepare(
        `SELECT ${key} AS key, COUNT(*) AS clicks ${scope} GROUP BY key ORDER BY clicks DESC ${extra}`,
      )
      .bind(userId, from, to, link);

  const [totals, previous, created, series, hours, topLinks, countries, apps, devices] =
    await db.batch<Record<string, unknown>>([
      db
        .prepare(
          `SELECT COUNT(*) AS clicks, COUNT(DISTINCT c.url_id) AS activeLinks,
             SUM(CASE WHEN c.source = 'qr' THEN 1 ELSE 0 END) AS qrScans ${scope}`,
        )
        .bind(userId, from, to, link),
      db
        .prepare(
          `SELECT COUNT(*) AS clicks FROM clicks c JOIN urls u ON u.id = c.url_id
            WHERE u.user_id = ?1 AND c.clicked_at >= ?2 AND c.clicked_at < ?3
              AND (?4 IS NULL OR c.url_id = ?4)`,
        )
        .bind(userId, prevDate ? sqlDateTime(prevDate) : from, from, link),
      db
        .prepare(
          `SELECT COUNT(*) AS linksCreated FROM urls
            WHERE user_id = ?1 AND datetime(created_at) >= ?2 AND (?3 IS NULL OR id = ?3)`,
        )
        .bind(userId, from, link),
      db
        .prepare(
          `SELECT ${bucket} AS key, COUNT(*) AS clicks ${scope} GROUP BY key ORDER BY key`,
        )
        .bind(userId, from, to, link),
      db
        .prepare(
          `SELECT strftime('%H', c.clicked_at) AS key, COUNT(*) AS clicks ${scope} GROUP BY key ORDER BY key`,
        )
        .bind(userId, from, to, link),
      grouped("c.url_id", `LIMIT ${TOP_LIMIT}`),
      grouped("c.country", `LIMIT ${TOP_LIMIT}`),
      grouped("c.app"),
      grouped("c.device"),
    ]);

  const rows = <K extends string | null>(result: D1Result<Record<string, unknown>>) =>
    result.results.map((r) => ({
      key: (r.key ?? null) as K,
      clicks: Number(r.clicks) || 0,
    }));
  const first = (result: D1Result<Record<string, unknown>>) =>
    result.results[0] ?? {};

  return {
    range,
    from: fromDate ? fromDate.toISOString() : null,
    to: now.toISOString(),
    totals: {
      clicks: Number(first(totals).clicks) || 0,
      previousClicks: days ? Number(first(previous).clicks) || 0 : null,
      activeLinks: Number(first(totals).activeLinks) || 0,
      linksCreated: Number(first(created).linksCreated) || 0,
      qrScans: Number(first(totals).qrScans) || 0,
    },
    series: { granularity: days ? "hour" : "day", buckets: rows<string>(series) },
    hours: rows<string>(hours),
    topLinks: rows<string>(topLinks),
    countries: rows(countries),
    apps: rows(apps),
    devices: rows(devices),
  };
}

export interface LiveClick {
  shortCode: string;
  clickedAt: string;
  country: string | null;
  app: string | null;
  device: string | null;
  source: string | null;
}

/**
 * The last hour, for the live view: clicks per minute and the most recent
 * clicks. Reads only that hour's rows (idx_clicks_clicked_at), so polling it
 * stays cheap no matter how much history a user has.
 */
export async function getLiveActivity(
  db: D1Database,
  { userId, link = null, now = new Date() }: { userId: string; link?: string | null; now?: Date },
): Promise<{ perMinute: Breakdown<string>[]; recent: LiveClick[]; to: string }> {
  const from = sqlDateTime(new Date(now.getTime() - 60 * 60_000));
  const scope = `FROM clicks c JOIN urls u ON u.id = c.url_id
    WHERE c.clicked_at > ?2 AND u.user_id = ?1 AND (?3 IS NULL OR c.url_id = ?3)`;
  const [perMinute, recent] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT strftime('%Y-%m-%dT%H:%M', c.clicked_at) AS key, COUNT(*) AS clicks ${scope} GROUP BY key ORDER BY key`,
      )
      .bind(userId, from, link),
    db
      .prepare(
        `SELECT c.url_id AS shortCode, c.clicked_at AS clickedAt, c.country, c.app, c.device, c.source
          ${scope} ORDER BY c.clicked_at DESC, c.id DESC LIMIT 10`,
      )
      .bind(userId, from, link),
  ]);
  return {
    perMinute: perMinute.results.map((r) => ({
      key: String(r.key),
      clicks: Number(r.clicks) || 0,
    })),
    recent: recent.results.map((r) => ({
      shortCode: String(r.shortCode),
      // Stored as UTC without a zone; make it unambiguous for the client
      clickedAt: `${String(r.clickedAt).replace(" ", "T")}Z`,
      country: (r.country as string | null) ?? null,
      app: (r.app as string | null) ?? null,
      device: (r.device as string | null) ?? null,
      source: (r.source as string | null) ?? null,
    })),
    to: now.toISOString(),
  };
}
