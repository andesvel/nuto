import type { ClickAttribution } from "@/utils/click-attribution";

/**
 * Logs a click and updates the link's counters in one D1 round trip.
 * Only privacy-safe fields are stored (never the IP); source, app and
 * device are derived from the URL and user agent at click time.
 */
export async function recordClick(
  db: D1Database,
  click: {
    urlId: string;
    country: string | null;
    userAgent: string;
  } & Partial<ClickAttribution>,
): Promise<void> {
  await db.batch([
    db
      .prepare(
        "INSERT INTO clicks (url_id, clicked_at, country, user_agent, source, app, device) VALUES (?, datetime('now'), ?, ?, ?, ?, ?)",
      )
      .bind(
        click.urlId,
        click.country,
        click.userAgent,
        click.source ?? null,
        click.app ?? null,
        click.device ?? null,
      ),
    db
      .prepare(
        "UPDATE urls SET last_clicked = datetime('now'), click_count = click_count + 1 WHERE id = ?",
      )
      .bind(click.urlId),
  ]);
}
