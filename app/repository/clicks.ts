/**
 * Logs a click and updates the link's counters in one D1 round trip.
 * Only privacy-safe fields are stored (never the IP).
 */
export async function recordClick(
  db: D1Database,
  click: { urlId: string; country: string | null; userAgent: string },
): Promise<void> {
  await db.batch([
    db
      .prepare(
        "INSERT INTO clicks (url_id, clicked_at, country, user_agent) VALUES (?, datetime('now'), ?, ?)",
      )
      .bind(click.urlId, click.country, click.userAgent),
    db
      .prepare(
        "UPDATE urls SET last_clicked = datetime('now'), click_count = click_count + 1 WHERE id = ?",
      )
      .bind(click.urlId),
  ]);
}
