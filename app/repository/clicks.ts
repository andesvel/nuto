export async function insertClick(
  db: D1Database,
  click: { urlId: string; country: string | null; userAgent: string },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO clicks (url_id, clicked_at, country, user_agent) VALUES (?, datetime('now'), ?, ?)",
    )
    .bind(click.urlId, click.country, click.userAgent)
    .run();
}

export async function updateLastClicked(
  db: D1Database,
  urlId: string,
): Promise<void> {
  await db
    .prepare("UPDATE urls SET last_clicked = datetime('now') WHERE id = ?")
    .bind(urlId)
    .run();
}
