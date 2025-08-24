export async function enforceUrlLimit(
  db: D1Database,
  userId: string,
  max: number
) {
  const row = await db
    .prepare("SELECT COUNT(*) AS c FROM urls WHERE user_id = ?")
    .bind(userId)
    .first<{ c: number }>();
  if ((row?.c ?? 0) >= max) {
    throw new Response("URL limit reached.", { status: 429 });
  }
}
